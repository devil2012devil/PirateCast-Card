class PirateCastCard extends HTMLElement {
constructor() {
super();
this.attachShadow({ mode: "open" });
}

setConfig(config) {
const min = Number(config.min ?? -4);
const max = Number(config.max ?? 4);

if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
  throw new Error("PirateCast Card: min должен быть меньше max");
}

if (!(min < 0 && max > 0)) {
  throw new Error(
    "PirateCast Card: диапазон должен включать ноль"
  );
}

this._config = {
  entity: "sensor.piratecast_pressure_change_3h",
  title: "Изменение давления за 3 часа",
  min,
  max,
  ...config,
  min,
  max
};

this._render();

}

set hass(hass) {
this._hass = hass;
this._render();
}

getCardSize() {
return 3;
}

static getStubConfig() {
return {
entity: "sensor.piratecast_pressure_change_3h",
title: "Изменение давления за 3 часа",
min: -4,
max: 4
};
}

_escape(value) {
return String(value).replace(/[&<>"']/g, char => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
})[char]);
}

_render() {
if (!this.shadowRoot || !this._config || !this._hass) {
return;
}

const cfg = this._config;
const entity = this._hass.states[cfg.entity];

const value = entity ? Number(entity.state) : NaN;
const valid =
  entity &&
  entity.state !== "unknown" &&
  entity.state !== "unavailable" &&
  Number.isFinite(value);

const clamped = valid
  ? Math.max(cfg.min, Math.min(cfg.max, value))
  : 0;

const position = valid
  ? ((clamped - cfg.min) / (cfg.max - cfg.min)) * 100
  : ((0 - cfg.min) / (cfg.max - cfg.min)) * 100;

const falling = valid && value < -0.01;
const rising = valid && value > 0.01;

const displayValue = valid
  ? `${value > 0 ? "+" : ""}${value.toFixed(2)} мм рт. ст.`
  : "Нет данных";

const range = cfg.max - cfg.min;
const tick1 = cfg.min + range * 0.25;
const tick3 = cfg.min + range * 0.75;

const formatTick = number => {
  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded);
};

const arrow = falling
  ? `<svg class="trend falling" viewBox="0 0 32 12"
         role="img" aria-label="Давление снижается">
       <path d="M8 1 L1 6 L8 11 M2 6 H31"/>
     </svg>`
  : rising
  ? `<svg class="trend rising" viewBox="0 0 32 12"
         role="img" aria-label="Давление повышается">
       <path d="M24 1 L31 6 L24 11 M30 6 H1"/>
     </svg>`
  : "";

this.shadowRoot.innerHTML = `
  <style>
    :host {
      display: block;
      color: var(--primary-text-color);
    }

    ha-card {
      padding: 16px;
      overflow: hidden;
    }

    .title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 18px;
    }

    .weather {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      margin-bottom: 20px;
    }

    .weather span {
      flex: 1;
      text-align: center;
      font-size: clamp(21px, 6vw, 30px);
      line-height: 1.2;
      white-space: nowrap;
    }

    .track {
      position: relative;
      height: 24px;
      margin: 0 3px;
    }

    .bar {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 8px;
      box-sizing: border-box;
      transform: translateY(-50%);
      border: 1px solid var(--secondary-text-color);
      border-radius: 6px;
      background: transparent;
    }

    .marker {
      position: absolute;
      left: ${position}%;
      top: 50%;
      width: 2px;
      height: 24px;
      background: var(--info-color, #39BFD8);
      border-radius: 2px;
      transform: translate(-50%, -50%);
      z-index: 2;
    }

    .trend {
      position: absolute;
      top: 50%;
      width: 32px;
      height: 12px;
      overflow: visible;
      fill: none;
      stroke: #E09B42;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      transform: translateY(-50%);
      z-index: 3;
      pointer-events: none;
    }

    .trend.falling {
      left: calc(${position}% - 1px);
    }

    .trend.rising {
      left: calc(${position}% - 31px);
      stroke: #39BFD8;
    }

    .ticks {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      color: var(--secondary-text-color);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }

    .value {
      text-align: center;
      font-size: 20px;
      font-weight: 500;
      margin-top: 18px;
      font-variant-numeric: tabular-nums;
    }
  </style>

  <ha-card>
    <div class="title">${this._escape(cfg.title)}</div>

    <div class="weather" aria-hidden="true">
      <span>⛈️</span>
      <span>🌧️</span>
      <span>🌦️</span>
      <span>☁️</span>
      <span>🌤️</span>
      <span>☀️</span>
    </div>

    <div class="track">
      <div class="bar"></div>
      ${arrow}
      <div class="marker"></div>
    </div>

    <div class="ticks">
      <span>${formatTick(cfg.min)}</span>
      <span>${formatTick(tick1)}</span>
      <span>0</span>
      <span>${formatTick(tick3)}</span>
      <span>${formatTick(cfg.max)}</span>
    </div>

    <div class="value">${displayValue}</div>
  </ha-card>
`;

}
}

if (!customElements.get("piratecast-card")) {
customElements.define("piratecast-card", PirateCastCard);
}

window.customCards = window.customCards || [];

if (!window.customCards.some(card => card.type === "piratecast-card")) {
window.customCards.push({
type: "piratecast-card",
name: "PirateCast Card",
description: "Карточка тенденции атмосферного давления",
preview: true,
documentationURL:
"https://github.com/devil2012devil/PirateCast-Card"
});
}

console.info(
"%c PIRATECAST CARD %c v1.0.0 ",
"background:#1a1a2e;color:#E09B42;font-weight:bold;padding:2px 4px;border-radius:4px 0 0 4px;",
"background:#39BFD8;color:#000;font-weight:bold;padding:2px 4px;border-radius:0 4px 4px 0;"
);
