(() => {
  "use strict";

  const STORAGE_KEY = "houseTaxCalculator.v1";
  const form = document.getElementById("tax-form");
  const errorBox = document.getElementById("form-error");
  const amountOutput = document.getElementById("result-amount");
  const contextOutput = document.getElementById("result-context");
  const formulaOutput = document.getElementById("formula-text");
  const useFactorOutput = document.getElementById("use-factor");
  const constructionFactorOutput = document.getElementById("construction-factor");
  const ageFactorOutput = document.getElementById("age-factor");
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-nav");
  let clearAfterReset = false;

  const factors = {
    use: { residential: 1, commercial: 1.65 },
    construction: { standard: 1, reinforced: 1.15, light: 0.9 },
    age: { new: 1, mid: 0.9, older: 0.75 }
  };
  const labels = {
    use: { residential: "Residential", commercial: "Commercial" },
    construction: { standard: "Standard", reinforced: "Reinforced", light: "Light construction" },
    age: { new: "Newer", mid: "10–25 years", older: "Over 25 years" }
  };

  function getFormData() {
    return {
      municipality: document.getElementById("municipality").value.trim(),
      propertyUse: document.getElementById("property-use").value,
      area: document.getElementById("area").value,
      construction: document.getElementById("construction").value,
      age: document.getElementById("age").value,
      rate: document.getElementById("rate").value
    };
  }

  function saveFormData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormData()));
    } catch (error) {
      errorBox.textContent = "Could not save inputs in this browser. You can still use the calculator.";
    }
  }

  function restoreFormData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data || typeof data !== "object") return;
      document.getElementById("municipality").value = typeof data.municipality === "string" ? data.municipality.slice(0, 80) : "";
      if (["residential", "commercial"].includes(data.propertyUse)) document.getElementById("property-use").value = data.propertyUse;
      if (["standard", "reinforced", "light"].includes(data.construction)) document.getElementById("construction").value = data.construction;
      if (["new", "mid", "older"].includes(data.age)) document.getElementById("age").value = data.age;
      if (typeof data.area === "string" || typeof data.area === "number") document.getElementById("area").value = data.area;
      if (typeof data.rate === "string" || typeof data.rate === "number") document.getElementById("rate").value = data.rate;
      if (document.getElementById("area").value) calculate({ announceErrors: false });
    } catch (error) {
      errorBox.textContent = "Saved inputs could not be restored. Clear them or enter new values.";
    }
  }

  function formatRupees(value) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2
    }).format(value);
  }

  function calculate({ announceErrors = true } = {}) {
    errorBox.textContent = "";
    const areaInput = document.getElementById("area");
    const rateInput = document.getElementById("rate");
    const area = Number(areaInput.value);
    const rate = Number(rateInput.value);

    if (!areaInput.value || !Number.isFinite(area) || area <= 0) {
      if (announceErrors) errorBox.textContent = "Enter an area greater than 0 square feet.";
      if (announceErrors) areaInput.focus();
      return false;
    }
    if (area > 1000000) {
      if (announceErrors) errorBox.textContent = "Enter an area of 1,000,000 square feet or less.";
      if (announceErrors) areaInput.focus();
      return false;
    }
    if (!rateInput.value || !Number.isFinite(rate) || rate <= 0) {
      if (announceErrors) errorBox.textContent = "Enter an example base rate greater than ₹0.";
      if (announceErrors) rateInput.focus();
      return false;
    }
    if (rate > 100000) {
      if (announceErrors) errorBox.textContent = "Enter a rate of ₹100,000 or less.";
      if (announceErrors) rateInput.focus();
      return false;
    }

    const data = getFormData();
    const useFactor = factors.use[data.propertyUse];
    const constructionFactor = factors.construction[data.construction];
    const ageFactor = factors.age[data.age];
    const estimate = area * rate * useFactor * constructionFactor * ageFactor;
    const useLabel = labels.use[data.propertyUse];
    const location = data.municipality ? ` for ${data.municipality}` : "";

    amountOutput.innerHTML = `₹${formatRupees(estimate)} <small>/ year</small>`;
    contextOutput.textContent = `${formatRupees(area)} sq ft · ${useLabel.toLowerCase()} example${location}`;
    formulaOutput.textContent = `${formatRupees(area)} sq ft × ₹${formatRupees(rate)} / sq ft / year × ${useLabel} ${useFactor.toFixed(2)} × ${labels.construction[data.construction]} ${constructionFactor.toFixed(2)} × ${labels.age[data.age]} ${ageFactor.toFixed(2)} = ₹${formatRupees(estimate)} / year`;
    useFactorOutput.textContent = `${useLabel} ${useFactor.toFixed(2)}`;
    constructionFactorOutput.textContent = `${labels.construction[data.construction]} ${constructionFactor.toFixed(2)}`;
    ageFactorOutput.textContent = `${labels.age[data.age]} ${ageFactor.toFixed(2)}`;
    return true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (calculate()) saveFormData();
  });

  form.addEventListener("input", () => {
    errorBox.textContent = "";
    saveFormData();
  });

  form.addEventListener("change", saveFormData);

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      errorBox.textContent = "";
      amountOutput.innerHTML = "—<small>₹ / year</small>";
      contextOutput.textContent = "Enter a property area and calculate to see an example estimate.";
      formulaOutput.textContent = "Area × base rate × use factor × construction factor × age factor";
      useFactorOutput.textContent = "Residential 1.00";
      constructionFactorOutput.textContent = "Standard 1.00";
      ageFactorOutput.textContent = "Newer 1.00";
      if (clearAfterReset) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          errorBox.textContent = "Could not clear saved inputs in this browser.";
        }
        clearAfterReset = false;
      } else {
        saveFormData();
      }
    }, 0);
  });

  document.getElementById("sample-button").addEventListener("click", () => {
    document.getElementById("municipality").value = "Example municipality";
    document.getElementById("property-use").value = "residential";
    document.getElementById("area").value = "950";
    document.getElementById("construction").value = "standard";
    document.getElementById("age").value = "mid";
    document.getElementById("rate").value = "2.4";
    calculate();
    saveFormData();
    document.getElementById("area").focus();
  });

  document.getElementById("clear-saved").addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      clearAfterReset = true;
      form.reset();
      errorBox.textContent = "Saved inputs cleared from this browser.";
      document.getElementById("municipality").focus();
    } catch (error) {
      errorBox.textContent = "Could not clear saved inputs in this browser.";
    }
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.querySelector(".sr-only").textContent = isOpen ? "Open navigation menu" : "Close navigation menu";
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navigation.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.querySelector(".sr-only").textContent = "Open navigation menu";
    }
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();
  restoreFormData();
})();
