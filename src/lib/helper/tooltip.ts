import CommonHelper from "./commentHelper";


let showTimeoutId: ReturnType<typeof setTimeout>;
let tooltipContainer: HTMLDivElement | null;

const defaultTooltipClass = "app-tooltip";

interface TooltipData {
  text: string;
  position:"top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  class?: string;
  delay?: number;
  hideOnClick?: boolean | null; // Auto
}
interface CustomTooltip extends HTMLDivElement {
    activeNode?: any;
  }

function normalize(rawData: string | TooltipData): TooltipData {
  if (typeof rawData == "string") {
    return {
      text: rawData,
      position: "bottom",
      hideOnClick: null, // auto
    };
  }

  return rawData || {};
}

function getTooltip(): CustomTooltip | null | HTMLDivElement {
  tooltipContainer = tooltipContainer || document.querySelector("." + defaultTooltipClass);

  if (!tooltipContainer) {
    // create
    tooltipContainer = document.createElement("div");
    tooltipContainer.classList.add(defaultTooltipClass);
    document.body.appendChild(tooltipContainer);
  }

  return tooltipContainer;
}

function refreshTooltip(node: HTMLElement, data: TooltipData) {
  const tooltip: CustomTooltip | null = getTooltip();
  if (!tooltip?.classList.contains("active") || !data?.text) {
    hideTooltip();
    return; // no need to update since it is not active or there is no text to display
  }

  // set tooltip content
  tooltip.textContent = data.text;

  // reset tooltip styling
  tooltip.className = defaultTooltipClass + " active";
  if (data.class) {
    tooltip.classList.add(data.class);
  }
  if (data.position) {
    tooltip.classList.add(data.position);
  }

  // reset tooltip position
  tooltip.style.top = "0px";
  tooltip.style.left = "0px";

  // note: doesn't use getBoundingClientRect() here because the
  // tooltip could be animated/scaled/transformed and we need the real size
  const tooltipHeight = tooltip.offsetHeight;
  const tooltipWidth = tooltip.offsetWidth;

  const nodeRect = node.getBoundingClientRect();
  let top = 0;
  let left = 0;
  const tolerance = 5;

  // calculate tooltip position position
  if (data.position == "left") {
    top = nodeRect.top + nodeRect.height / 2 - tooltipHeight / 2;
    left = nodeRect.left - tooltipWidth - tolerance;
  } else if (data.position == "right") {
    top = nodeRect.top + nodeRect.height / 2 - tooltipHeight / 2;
    left = nodeRect.right + tolerance;
  } else if (data.position == "top") {
    top = nodeRect.top - tooltipHeight - tolerance;
    left = nodeRect.left + nodeRect.width / 2 - tooltipWidth / 2;
  } else if (data.position == "top-left") {
    top = nodeRect.top - tooltipHeight - tolerance;
    left = nodeRect.left;
  } else if (data.position == "top-right") {
    top = nodeRect.top - tooltipHeight - tolerance;
    left = nodeRect.right - tooltipWidth;
  } else if (data.position == "bottom-left") {
    top = nodeRect.top + nodeRect.height + tolerance;
    left = nodeRect.left;
  } else if (data.position == "bottom-right") {
    top = nodeRect.top + nodeRect.height + tolerance;
    left = nodeRect.right - tooltipWidth;
  } else {
    // bottom
    top = nodeRect.top + nodeRect.height + tolerance;
    left = nodeRect.left + nodeRect.width / 2 - tooltipWidth / 2;
  }

  // right edge boundary
  if (left + tooltipWidth > document.documentElement.clientWidth) {
    left = document.documentElement.clientWidth - tooltipWidth;
  }

  // left edge boundary
  left = left >= 0 ? left : 0;

  // bottom edge boundary
  if (top + tooltipHeight > document.documentElement.clientHeight) {
    top = document.documentElement.clientHeight - tooltipHeight;
  }

  // top edge boundary
  top = top >= 0 ? top : 0;

  // apply new tooltip position
  tooltip.style.top = top + "px";
  tooltip.style.left = left + "px";
}

function hideTooltip() {
  clearTimeout(showTimeoutId);
  const tooltip:  CustomTooltip | null | undefined = getTooltip();
  if (tooltip) {
    tooltip.classList.remove("active");
    tooltip.activeNode = undefined;
  }
}

function showTooltip(node: HTMLElement, data: TooltipData) {
  const tooltip: CustomTooltip | null | undefined = getTooltip();
  tooltip!.activeNode = node;

  clearTimeout(showTimeoutId);
  showTimeoutId = setTimeout(() => {
    tooltip!.classList.add("active");

    refreshTooltip(node, data);
  }, !isNaN(data.delay as number) ? (data.delay as number) : 0);
}

export default function tooltip(node: HTMLElement, tooltipData: string | TooltipData) {
  let data = normalize(tooltipData);

  function showEventHandler() {
    showTooltip(node, data);
  }

  function hideEventHandler() {
    hideTooltip();
  }

  node.addEventListener("mouseenter", showEventHandler);
  node.addEventListener("mouseleave", hideEventHandler);
  node.addEventListener("blur-sm", hideEventHandler);
  if (data.hideOnClick === true || (data.hideOnClick === null && CommonHelper.isFocusable(node))) {
    node.addEventListener("click", hideEventHandler);
  }

  // trigger tooltip container creation (if not inserted already)
  getTooltip();

  return {
    update(newTooltipData: string | TooltipData) {
      data = normalize(newTooltipData);
        const tooltip = getTooltip();
      if (tooltip && 'activeNode' in tooltip && tooltip?.activeNode?.contains(node)) {
        refreshTooltip(node, data);
      }
    },
    destroy() {
        const tooltip = getTooltip();
      if (tooltip && 'activeNode' in tooltip && tooltip?.activeNode?.contains(node)) {
        hideTooltip();
      }

      node.removeEventListener("mouseenter", showEventHandler);
      node.removeEventListener("mouseleave", hideEventHandler);
      node.removeEventListener("blur-sm", hideEventHandler);
      node.removeEventListener("click", hideEventHandler);
    },
  };
}
