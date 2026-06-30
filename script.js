import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mopdxxvjwyetogjvzval.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rLZ1NHhtdkEDxDQG0d9W5Q_jKjc6OEt";
const WAITLIST_TABLE = "waitlist_emails";

const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const revealTargets = [
  ".story-inner .eyebrow",
  ".story-layout h2",
  ".story-copy",
  ".features-inner .eyebrow",
  ".features-inner h2",
  ".section-subtitle",
  ".mode-card",
  ".use-cases-copy h2",
  ".use-cases-copy .section-subtitle",
  ".people-photo",
];

const targets = revealTargets.flatMap((selector) =>
  Array.from(document.querySelectorAll(selector)),
);

targets.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.12,
  },
);

targets.forEach((element) => revealObserver.observe(element));

const form = document.querySelector(".email-form");
const emailInput = document.querySelector("#email");
const submitButton = form?.querySelector("button");
const statusElement = document.querySelector(".form-status");
const reservationModal = document.querySelector(".reservation-modal");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");

function setStatus(message) {
  if (!statusElement) return;
  statusElement.textContent = message;
}

function openReservationModal() {
  reservationModal?.classList.add("is-open");
  reservationModal?.setAttribute("aria-hidden", "false");
}

function closeReservationModal() {
  reservationModal?.classList.remove("is-open");
  reservationModal?.setAttribute("aria-hidden", "true");
}

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeReservationModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeReservationModal();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput?.value.trim().toLowerCase();

  if (!email || !emailInput.validity.valid) {
    setStatus("Enter your email to reserve a spot.");
    return;
  }

  if (!supabase) {
    setStatus("Waitlist is not connected yet.");
    return;
  }

  submitButton.disabled = true;
  setStatus("Reserving your spot…");

  const { error } = await supabase.from(WAITLIST_TABLE).insert({
    email,
    source: "firefly-site",
  });

  submitButton.disabled = false;

  if (error) {
    if (error.code === "23505") {
      setStatus("");
      form.reset();
      openReservationModal();
      return;
    }

    setStatus("Something went wrong. Please try again.");
    return;
  }

  form.reset();
  setStatus("");
  openReservationModal();
});
