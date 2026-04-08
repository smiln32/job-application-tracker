const STORAGE_KEY = "job_tracker_pro_v3";

const STATUS_OPTIONS = [
  "All",
  "Saved",
  "Applied",
  "Recruiter Screen",
  "Hiring Manager",
  "Team Interview",
  "Final Interview",
  "Offer",
  "Rejected",
  "Withdrawn"
];

const ACTIVE_STATUSES = new Set([
  "Saved",
  "Applied",
  "Recruiter Screen",
  "Hiring Manager",
  "Team Interview",
  "Final Interview"
]);

const INTERVIEW_STATUSES = new Set([
  "Recruiter Screen",
  "Hiring Manager",
  "Team Interview",
  "Final Interview"
]);

const CLOSED_STATUSES = new Set(["Offer", "Rejected", "Withdrawn"]);

const statusFilter = document.getElementById("statusFilter");
const statusField = document.getElementById("status");
const priorityFilter = document.getElementById("priorityFilter");
const sortBy = document.getElementById("sortBy");
const searchInput = document.getElementById("searchInput");
const cardsContainer = document.getElementById("cardsContainer");
const emptyState = document.getElementById("emptyState");
const resultsCount = document.getElementById("resultsCount");
const pipelineChips = document.getElementById("pipelineChips");

const metricTotal = document.getElementById("metricTotal");
const metricActive = document.getElementById("metricActive");
const metricInterview = document.getElementById("metricInterview");
const metricDue = document.getElementById("metricDue");
const metricResponseRate = document.getElementById("metricResponseRate");
const metricOfferRate = document.getElementById("metricOfferRate");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const applicationForm = document.getElementById("applicationForm");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const recordId = document.getElementById("recordId");
const company = document.getElementById("company");
const role = document.getElementById("role");
const status = document.getElementById("status");
const priority = document.getElementById("priority");
const workType = document.getElementById("workType");
const source = document.getElementById("source");
const salary = document.getElementById("salary");
const jobUrl = document.getElementById("jobUrl");
const appliedDate = document.getElementById("appliedDate");
const nextActionDate = document.getElementById("nextActionDate");
const lastContactDate = document.getElementById("lastContactDate");
const nextAction = document.getElementById("nextAction");
const notes = document.getElementById("notes");

const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

function populateStatuses() {
  statusFilter.innerHTML = STATUS_OPTIONS.map(item => `<option value="${item}">${item === "All" ? "All statuses" : item}</option>`).join("");
  statusField.innerHTML = STATUS_OPTIONS.filter(item => item !== "All").map(item => `<option value="${item}">${item}</option>`).join("");
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function todayString() {
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  return new Date(today - tzOffset).toISOString().slice(0, 10);
}

function dueState(dateString) {
  if (!dateString) return "none";
  const today = todayString();
  if (dateString < today) return "urgent";
  if (dateString === today) return "today";
  return "ok";
}

function responseRate(records) {
  if (!records.length) return 0;
  const responded = records.filter(r => INTERVIEW_STATUSES.has(r.status) || r.status === "Offer").length;
  return Math.round((responded / records.length) * 100);
}

function offerRate(records) {
  if (!records.length) return 0;
  const offers = records.filter(r => r.status === "Offer").length;
  return Math.round((offers / records.length) * 100);
}

function pipelineCounts(records) {
  return STATUS_OPTIONS
    .filter(item => item !== "All")
    .map(status => ({
      status,
      count: records.filter(r => r.status === status).length
    }));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPriorityWeight(value) {
  return value === "High" ? 3 : value === "Medium" ? 2 : 1;
}

function sortRecords(records) {
  const mode = sortBy.value;
  return [...records].sort((a, b) => {
    if (mode === "company") return (a.company || "").localeCompare(b.company || "");
    if (mode === "applied") return (b.appliedDate || "").localeCompare(a.appliedDate || "");
    if (mode === "updated") return (b.updatedAt || "").localeCompare(a.updatedAt || "");

    const dueA = dueState(a.nextActionDate);
    const dueB = dueState(b.nextActionDate);
    const rank = { urgent: 3, today: 2, ok: 1, none: 0 };
    const diffDue = rank[dueB] - rank[dueA];
    if (diffDue !== 0) return diffDue;

    const diffPriority = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (diffPriority !== 0) return diffPriority;

    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
}

function getFilteredRecords() {
  const records = loadRecords();
  const search = searchInput.value.trim().toLowerCase();
  const statusVal = statusFilter.value;
  const priorityVal = priorityFilter.value;

  const filtered = records.filter(record => {
    const haystack = [
      record.company,
      record.role,
      record.source,
      record.nextAction,
      record.notes
    ].join(" ").toLowerCase();

    const searchMatch = !search || haystack.includes(search);
    const statusMatch = statusVal === "All" || record.status === statusVal;
    const priorityMatch = priorityVal === "All" || record.priority === priorityVal;

    return searchMatch && statusMatch && priorityMatch;
  });

  return sortRecords(filtered);
}

function renderMetrics(records) {
  metricTotal.textContent = records.length;
  metricActive.textContent = records.filter(r => ACTIVE_STATUSES.has(r.status)).length;
  metricInterview.textContent = records.filter(r => INTERVIEW_STATUSES.has(r.status)).length;
  metricDue.textContent = records.filter(r => !CLOSED_STATUSES.has(r.status) && ["urgent", "today"].includes(dueState(r.nextActionDate))).length;
  metricResponseRate.textContent = responseRate(records) + "%";
  metricOfferRate.textContent = offerRate(records) + "%";
}

function renderPipeline(records) {
  const counts = pipelineCounts(records);
  pipelineChips.innerHTML = counts.map(item => `
    <div class="pipeline-chip">
      <strong>${item.count}</strong>
      <span>${escapeHtml(item.status)}</span>
    </div>
  `).join("");
}

function clearForm() {
  applicationForm.reset();
  recordId.value = "";
  modalTitle.textContent = "New Application";
  status.value = "Applied";
  priority.value = "Medium";
}

function openModal(record = null) {
  clearForm();

  if (record) {
    modalTitle.textContent = "Edit Application";
    recordId.value = record.id;
    company.value = record.company || "";
    role.value = record.role || "";
    status.value = record.status || "Applied";
    priority.value = record.priority || "Medium";
    workType.value = record.workType || "";
    source.value = record.source || "";
    salary.value = record.salary || "";
    jobUrl.value = record.jobUrl || "";
    appliedDate.value = record.appliedDate || "";
    nextActionDate.value = record.nextActionDate || "";
    lastContactDate.value = record.lastContactDate || "";
    nextAction.value = record.nextAction || "";
    notes.value = record.notes || "";
  }

  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

function formatMaybeLink(url) {
  if (!url) return "—";
  const safe = escapeHtml(url);
  return `<a class="link" href="${safe}" target="_blank" rel="noopener noreferrer">Open posting</a>`;
}

function renderCards(records) {
  const filtered = getFilteredRecords();
  cardsContainer.innerHTML = "";

  emptyState.classList.toggle("hidden", records.length !== 0);
  resultsCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    if (records.length) {
      cardsContainer.innerHTML = `<section class="panel empty-state"><h2>No matches</h2><p>Try changing your search, filters, or sorting.</p></section>`;
    }
    return;
  }

  cardsContainer.innerHTML = filtered.map(record => {
    const due = dueState(record.nextActionDate);
    const dueText = due === "urgent" ? "Overdue" : due === "today" ? "Due today" : record.nextActionDate || "—";
    const notesPreview = record.notes
      ? escapeHtml(record.notes.length > 220 ? record.notes.slice(0, 220) + "..." : record.notes)
      : "No notes yet.";

    return `
      <article class="card ${due}">
        <div class="card-top">
          <div>
            <h3 class="role-title">${escapeHtml(record.role)}</h3>
            <div class="company-name">${escapeHtml(record.company)}</div>
          </div>
          <div class="badges">
            <span class="badge status">${escapeHtml(record.status)}</span>
            <span class="badge priority-${(record.priority || "Medium").toLowerCase()}">${escapeHtml(record.priority || "Medium")} priority</span>
          </div>
        </div>

        <div class="card-grid">
          <div class="meta-block">
            <small>Applied</small>
            <div>${escapeHtml(record.appliedDate || "—")}</div>
          </div>
          <div class="meta-block">
            <small>Action due</small>
            <div>${escapeHtml(dueText)}</div>
          </div>
          <div class="meta-block">
            <small>Source</small>
            <div>${escapeHtml(record.source || "—")}</div>
          </div>
          <div class="meta-block">
            <small>Work type</small>
            <div>${escapeHtml(record.workType || "—")}</div>
          </div>
          <div class="meta-block">
            <small>Salary</small>
            <div>${escapeHtml(record.salary || "—")}</div>
          </div>
          <div class="meta-block">
            <small>Last contact</small>
            <div>${escapeHtml(record.lastContactDate || "—")}</div>
          </div>
        </div>

        <section class="next-action">
          <h3>Next action</h3>
          <p>${escapeHtml(record.nextAction || "No next action recorded.")}</p>
        </section>

        <div class="notes">${notesPreview}</div>

        <div class="card-actions">
          <button class="btn btn-secondary" data-edit="${record.id}">Edit</button>
          <button class="btn btn-secondary" data-delete="${record.id}">Delete</button>
          ${record.jobUrl ? formatMaybeLink(record.jobUrl) : ""}
        </div>
      </article>
    `;
  }).join("");

  cardsContainer.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const records = loadRecords();
      const record = records.find(r => r.id === btn.dataset.edit);
      if (record) openModal(record);
    });
  });

  cardsContainer.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      const records = loadRecords();
      const updated = records.filter(r => r.id !== btn.dataset.delete);
      if (updated.length !== records.length && window.confirm("Delete this application?")) {
        saveRecords(updated);
        render();
      }
    });
  });
}

function render() {
  const records = loadRecords();
  renderMetrics(records);
  renderPipeline(records);
  renderCards(records);
}

applicationForm.addEventListener("submit", event => {
  event.preventDefault();

  const record = {
    id: recordId.value || createId(),
    company: company.value.trim(),
    role: role.value.trim(),
    status: status.value,
    priority: priority.value,
    workType: workType.value,
    source: source.value.trim(),
    salary: salary.value.trim(),
    jobUrl: jobUrl.value.trim(),
    appliedDate: appliedDate.value,
    nextActionDate: nextActionDate.value,
    lastContactDate: lastContactDate.value,
    nextAction: nextAction.value.trim(),
    notes: notes.value.trim(),
    updatedAt: new Date().toISOString()
  };

  const records = loadRecords();
  const index = records.findIndex(r => r.id === record.id);

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  saveRecords(records);
  closeModal();
  render();
});

openModalBtn.addEventListener("click", () => openModal());
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", event => {
  if (event.target === modalOverlay) closeModal();
});

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
priorityFilter.addEventListener("change", render);
sortBy.addEventListener("change", render);

exportBtn.addEventListener("click", () => {
  const records = loadRecords();
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "job-tracker-pro-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error("Invalid");
      saveRecords(parsed);
      render();
      alert("Import complete.");
    } catch {
      alert("That file could not be imported.");
    }
  };
  reader.readAsText(file);
  importInput.value = "";
});

populateStatuses();
clearForm();
render();
