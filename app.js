const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const MIN_SEARCH_INTERVAL_MS = 1100;

const places = { start: null, end: null };
let nextSearchAt = 0;
let activeRequests = 0;

const calculateButton = document.querySelector("#calculate-button");
const distanceCard = document.querySelector("#distance-card");
const message = document.querySelector("#message");

function setMessage(text, kind) {
  message.textContent = text;
  message.dataset.kind = kind;
  message.hidden = !text;
}

function updateCalculateButton() {
  calculateButton.disabled = !places.start || !places.end || activeRequests > 0;
}

function selectPlace(field, place, button) {
  places[field] = place;
  const results = document.querySelector(`#${field}-results`);
  results.querySelectorAll(".result-option").forEach((option) => {
    option.setAttribute("aria-selected", String(option === button));
  });
  results.hidden = true;
  document.querySelector(`#${field}-input`).value = place.name || place.display_name;
  document.querySelector(`#${field}-status`).textContent = `선택: ${place.display_name}`;
  updateCalculateButton();
}

async function searchPlace(field) {
  const input = document.querySelector(`#${field}-input`);
  const status = document.querySelector(`#${field}-status`);
  const results = document.querySelector(`#${field}-results`);
  const searchButton = document.querySelector(`[data-search="${field}"]`);
  const query = input.value.trim();

  places[field] = null;
  results.replaceChildren();
  results.hidden = true;
  distanceCard.hidden = true;
  updateCalculateButton();
  setMessage("", "");

  if (!query) {
    status.textContent = "검색할 장소 이름을 입력해 주세요.";
    input.focus();
    return;
  }

  const now = Date.now();
  const wait = Math.max(0, nextSearchAt - now);
  nextSearchAt = now + wait + MIN_SEARCH_INTERVAL_MS;
  if (wait > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, wait));
  }

  activeRequests += 1;
  searchButton.disabled = true;
  status.textContent = "실제 장소를 검색하고 있습니다…";

  try {
    const url = new URL(NOMINATIM_URL);
    url.search = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "5",
      "accept-language": "ko",
      addressdetails: "1",
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`장소 검색에 실패했습니다. (${response.status})`);
    }

    const matches = await response.json();
    if (!Array.isArray(matches)) {
      throw new Error("장소 검색 결과를 읽을 수 없습니다.");
    }

    if (matches.length === 0) {
      status.textContent = "검색 결과가 없습니다. 다른 이름으로 검색해 주세요.";
      return;
    }

    matches.forEach((place, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "result-option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.textContent = place.display_name;
      option.addEventListener("click", () => selectPlace(field, place, option));
      results.append(option);

      if (index === 0 && matches.length === 1) {
        selectPlace(field, place, option);
      }
    });
    results.hidden = false;
    status.textContent = `${matches.length}개의 장소를 찾았습니다. 정확한 결과를 선택해 주세요.`;
  } catch (error) {
    status.textContent =
      error instanceof TypeError
        ? "장소 검색 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
        : error.message;
  } finally {
    activeRequests -= 1;
    searchButton.disabled = false;
    updateCalculateButton();
  }
}

async function calculateDistance() {
  if (!places.start || !places.end) return;

  calculateButton.disabled = true;
  document.querySelector("#calculate-label").textContent = "경로를 찾는 중…";
  distanceCard.hidden = true;
  setMessage("", "");

  try {
    const coordinates = [
      `${places.start.lon},${places.start.lat}`,
      `${places.end.lon},${places.end.lat}`,
    ].join(";");
    const url = `${OSRM_URL}/${coordinates}?overview=false&steps=false`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`경로 검색에 실패했습니다. (${response.status})`);
    }

    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("두 장소 사이의 자동차 경로를 찾을 수 없습니다.");
    }

    const distanceKm = data.routes[0].distance / 1000;
    document.querySelector("#distance-value").textContent = new Intl.NumberFormat(
      "ko-KR",
      { maximumFractionDigits: 1 },
    ).format(distanceKm);
    document.querySelector("#route-summary").textContent =
      `${places.start.display_name}에서 ${places.end.display_name}까지`;

    const mapUrl = new URL("https://www.openstreetmap.org/directions");
    mapUrl.searchParams.set(
      "engine",
      `fossgis_osrm_car;${places.start.lat},${places.start.lon};${places.end.lat},${places.end.lon}`,
    );
    document.querySelector("#map-link").href = mapUrl.toString();
    distanceCard.hidden = false;
  } catch (error) {
    setMessage(
      error instanceof TypeError
        ? "경로 검색 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
        : error.message,
      "error",
    );
  } finally {
    document.querySelector("#calculate-label").textContent = "거리 확인하기";
    updateCalculateButton();
  }
}

document.querySelectorAll("[data-search]").forEach((button) => {
  button.addEventListener("click", () => searchPlace(button.dataset.search));
});

document.querySelectorAll(".location-field input").forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchPlace(input.closest(".location-field").dataset.field);
    }
  });
  input.addEventListener("input", () => {
    const field = input.closest(".location-field").dataset.field;
    places[field] = null;
    document.querySelector(`#${field}-results`).hidden = true;
    document.querySelector(`#${field}-status`).textContent =
      "장소 이름을 검색한 다음 결과를 선택해 주세요.";
    distanceCard.hidden = true;
    updateCalculateButton();
  });
});

calculateButton.addEventListener("click", calculateDistance);
