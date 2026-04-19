function sanitizePersonName(value) {
  return value.replace(/[^\p{Script=Latin}\p{Script=Cyrillic}\s-]/gu, "");
}

function formatRussianPhone(value) {
  let digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }

  if (!digits.startsWith("7")) {
    digits = "7" + digits;
  }

  digits = digits.slice(0, 11);

  let result = "+7";

  if (digits.length > 1) {
    result += " (" + digits.slice(1, 4);
  }

  if (digits.length >= 5) {
    result += ") " + digits.slice(4, 7);
  }

  if (digits.length >= 8) {
    result += "-" + digits.slice(7, 9);
  }

  if (digits.length >= 10) {
    result += "-" + digits.slice(9, 11);
  }

  return result;
}

function isValidPersonName(value) {
  return (
    /^[\p{Script=Latin}\p{Script=Cyrillic}\s-]+$/u.test(value) &&
    /[\p{Script=Latin}\p{Script=Cyrillic}]/u.test(value)
  );
}

async function submitLead(payload) {
  let response;

  try {
    response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443 \u0438\u0437-\u0437\u0430 \u043E\u0448\u0438\u0431\u043A\u0438 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437."
    );
  }

  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437."
    );
  }

  return result;
}

function ensureFormFeedback(form, centered, beforeSelector) {
  if (!(form instanceof HTMLFormElement)) {
    return null;
  }

  let feedback = form.querySelector(".form-feedback");
  const beforeElement =
    typeof beforeSelector === "string" ? form.querySelector(beforeSelector) : null;

  if (!(feedback instanceof HTMLElement)) {
    feedback = document.createElement("p");
    feedback.className = centered ? "form-feedback form-feedback--center" : "form-feedback";
    feedback.hidden = true;
    feedback.setAttribute("aria-live", "polite");

    if (beforeElement instanceof HTMLElement) {
      form.insertBefore(feedback, beforeElement);
    } else {
      form.appendChild(feedback);
    }
  }

  return feedback;
}

function setFormFeedback(element, message, state) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.textContent = message || "";
  element.hidden = !message;

  if (message && state) {
    element.dataset.state = state;
  } else {
    delete element.dataset.state;
  }
}

function setButtonLoadingState(button, isLoading, idleLabel, loadingLabel) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingLabel : idleLabel;
}


