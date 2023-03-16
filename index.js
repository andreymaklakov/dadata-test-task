class SuggestionInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(
      document
        .getElementById("suggestion-input-template")
        .content.cloneNode(true)
    );
    this.token = "830adb2c5e964bfb71cfea8e878cb769c50f8f06";
    this.partyInput = this.shadowRoot.querySelector("#party");
    this.suggestionsContainer = this.shadowRoot.querySelector("#suggestions");

    this.join = this.join.bind(this);
    this.typeDescription = this.typeDescription.bind(this);
    this.autoFillInputs = this.autoFillInputs.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  connectedCallback() {
    this.partyInput.addEventListener("input", this.handleInput);
  }

  disconnectedCallback() {
    this.partyInput.removeEventListener("input", this.handleInput);
  }

  join(arr, separator = ", ") {
    return arr.filter((n) => n).join(separator);
  }

  typeDescription(type) {
    const TYPES = {
      INDIVIDUAL: "Индивидуальный предприниматель",
      LEGAL: "Организация",
    };
    return TYPES[type];
  }

  autoFillInputs(suggestion) {
    const data = suggestion.data;
    if (!data) return;

    const type = this.typeDescription(data.type);
    this.shadowRoot.querySelector(
      "#type"
    ).textContent = `${type} (${data.type})`;

    if (data.name) {
      this.shadowRoot.querySelector("#name_short").value =
        data.name.short_with_opf || "";
      this.partyInput.value = data.name.short_with_opf || "";
      this.shadowRoot.querySelector("#name_full").value =
        data.name.full_with_opf || "";
    }

    this.shadowRoot.querySelector("#inn_kpp").value = this.join(
      [data.inn, data.kpp],
      " / "
    );

    if (data.address) {
      let address = "";
      if (data.address.data.qc == "0") {
        address = this.join([
          data.address.data.postal_code,
          data.address.value,
        ]);
      } else {
        address = data.address.data.source;
      }
      this.shadowRoot.querySelector("#address").value = address;
    }

    this.suggestionsContainer.innerHTML = "";
    this.suggestionsContainer.classList.remove("suggestions_show");
  }

  handleInput() {
    const query = this.partyInput.value.trim();
    if (query.length < 1) {
      this.suggestionsContainer.innerHTML = "";
      this.suggestionsContainer.classList.remove("suggestions_show");
      return;
    }
    fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${this.token}`,
        },
        body: JSON.stringify({ query: query, count: 5 }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // Clear container
        this.suggestionsContainer.innerHTML = "";
        this.suggestionsContainer.classList.remove("suggestions_show");

        // Add list items to container
        data.suggestions.forEach((suggestion) => {
          const suggestionItem = document.createElement("div");
          suggestionItem.innerHTML = `<div>${suggestion.value}</div><div style="color: gray">${suggestion.data.inn}, ${suggestion.data.address.value}</div>`;
          suggestionItem.addEventListener("click", () => {
            this.autoFillInputs(suggestion);
          });
          this.suggestionsContainer.appendChild(suggestionItem);
          this.suggestionsContainer.classList.add("suggestions_show");
        });
      })
      .catch((error) => console.error(error));
  }
}

customElements.define("suggestion-input", SuggestionInput);
