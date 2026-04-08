const STORAGE_KEY = "job_application_tracker_v1";

const form = document.getElementById("applicationForm");
const applicationId = document.getElementById("applicationId");
const company = document.getElementById("company");
const role = document.getElementById("role");
const locationField = document.getElementById("location");
const workType = document.getElementById("workType");
const salary = document.getElementById("salary");
const source = document.getElementById("source");
const status = document.getElementById("status");
const appliedDate = document.getElementById("appliedDate");
const nextInterviewDate = document.getElementById("nextInterviewDate");
const stage = document.getElementById("stage");
const followupDate = document.getElementById("followupDate");
const jobUrl = document.getElementById("jobUrl");
const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const notes = document.getElementById("notes");
const applicationsList = document.getElementById("applicationsList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const formTitle = document.getElementById("formTitle");
const newBtn = document.getElementById("newBtn");
const resetBtn = document.getElementById("resetBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const resultsCount = document.getElementById("resultsCount");

const totalCount = document.getElementById("totalCount");
const interviewingCount = document.getElementById("interviewingCount");
const offerCount = document.getElementById("offerCount");
const followupCount = document.getElementById("followupCount");

function getApplications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveApplications(applications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function getFormData() {
  return {
    id: applicationId.value || createId(),
    company: company.value.trim(),
    role: role.value.trim(),
    location: locationField.value.trim(),
    workType: workType.value,
    salary: salary.value.trim(),
    source: source.value.trim(),
    status: status.value,
    appliedDate: appliedDate.value,
    nextInterviewDate: nextInterviewDate.value,
    stage: stage.value.trim(),
    followupDate: followupDate.value,
    jobUrl: jobUrl.value.trim(),
    contactName: contactName.value.trim(),
    contactEmail: contactEmail.value.trim(),
    notes: notes.value.trim(),
    updatedAt: new Date().toISOString()
  };
}

function clearForm() {
  form.reset();
  applicationId.value = "";
  formTitle.textContent = "Add Application";
  status.value = "Applied";
}

function fillForm(item) {
  applicationId.value = item.id;
  company.value = item.company || "";
  role.value = item.role || "";
  locationField.value = item.location || "";
  workType.value = item.workType || "";
  salary.value = item.salary || "";
  source.value = item.source || "";
  status.value = item.status || "Applied";
  appliedDate.value = item.appliedDate || "";
  nextInterviewDate.value = item.nextInterviewDate || "";
  stage.value = item.stage || "";
  followupDate.value = item.followupDate || "";
  jobUrl.value = item.jobUrl || "";
  contactName.value = item.contactName || "";
  contactEmail.value = item.contactEmail || "";
  notes.value = item.notes || "";
  formTitle.textContent = "Edit Application";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function isFollowupDue(dateString) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString + "T00:00:00");
  return target <= today;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStats(applications) {
  totalCount.textContent = applications.length;
  interviewingCount.textContent = applications.filter(a =>
    a.status === "Interviewing" || a.status === "Recruiter Screen"
  ).length;
  offerCount.textContent = applications.filter(a => a.status === "Offer").length;
  followupCount.textContent = applications.filter(a =>
    isFollowupDue(a.followupDate) && !["Rejected", "Withdrawn", "Offer"].includes(a.status)
  ).length;
}

function renderApplications() {
  const applications = getApplications();
  renderStats(applications);

  const search = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;

  const filtered = applications
    .filter(item => {
      const haystack = `${item.company} ${item.role}`.toLowerCase();
      const searchMatch = !search || haystack.includes(search);
      const statusMatch = filter === "All" || item.status === filter;
      return searchMatch && statusMatch;
    })
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  resultsCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    applicationsList.innerHTML = '<div class="empty-state">No applications match your current filters.</div>';
    return;
  }

  applicationsList.innerHTML = filtered.map(item => {
    const notesPreview = item.notes
      ? escapeHtml(item.notes.length > 180 ? item.notes.slice(0, 180) + "..." : item.notes)
      : "No notes yet.";

    const meta = [
      item.location && `Location: ${escapeHtml(item.location)}`,
      item.workType && `Work type: ${escapeHtml(item.workType)}`,
      item.salary && `Salary: ${escapeHtml(item.salary)}`,
      item.source && `Source: ${escapeHtml(item.source)}`,
      item.appliedDate && `Applied: ${escapeHtml(item.appliedDate)}`,
      item.stage && `Stage: ${escapeHtml(item.stage)}`,
      item.nextInterviewDate && `Next interview: ${escapeHtml(item.nextInterviewDate)}`,
      item.followupDate && `Follow-up: ${escapeHtml(item.followupDate)}${isFollowupDue(item.followupDate) ? " (due)" : ""}`,
      item.contactName && `Contact: ${escapeHtml(item.contactName)}`,
      item.contactEmail && `Email: ${escapeHtml(item.contactEmail)}`
    ].filter(Boolean);

    const linkBlock = item.jobUrl
      ? `<div><a class="inline-link" href="${escapeHtml(item.jobUrl)}" target="_blank" rel="noopener noreferrer">Open job listing</a></div>`
      : "";

    return `
      <article class="application-item">
        <div class="application-top">
          <div>
            <h3 class="application-title">${escapeHtml(item.role)}</h3>
            <div class="application-subtitle">${escapeHtml(item.company)}</div>
          </div>
          <span class="badge">${escapeHtml(item.status)}</span>
        </div>
        <div class="meta">
          ${meta.map(line => `<div>${line}</div>`).join("")}
          ${linkBlock}
        </div>
        <div class="notes-preview">${notesPreview}</div>
        <div class="item-actions">
          <button type="button" class="secondary" onclick="editApplication('${item.id}')">Edit</button>
          <button type="button" class="secondary" onclick="deleteApplication('${item.id}')">Delete</button>
        </div>
      </article>
    `;
  }).join("");
}

function upsertApplication(item) {
  const applications = getApplications();
  const index = applications.findIndex(entry => entry.id === item.id);

  if (index >= 0) {
    applications[index] = item;
  } else {
    applications.push(item);
  }

  saveApplications(applications);
  renderApplications();
  clearForm();
}

function deleteApplication(id) {
  const confirmed = window.confirm("Delete this application?");
  if (!confirmed) return;

  const applications = getApplications().filter(item => item.id !== id);
  saveApplications(applications);
  renderApplications();

  if (applicationId.value === id) {
    clearForm();
  }
}

function editApplication(id) {
  const item = getApplications().find(entry => entry.id === id);
  if (!item) return;
  fillForm(item);
}

function exportData() {
  const data = getApplications();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "job-applications-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!Array.isArray(parsed)) {
        throw new Error("Invalid file format");
      }
      saveApplications(parsed);
      renderApplications();
      clearForm();
      alert("Import complete.");
    } catch {
      alert("That file could not be imported.");
    }
  };
  reader.readAsText(file);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertApplication(getFormData());
});

newBtn.addEventListener("click", clearForm);
resetBtn.addEventListener("click", clearForm);
searchInput.addEventListener("input", renderApplications);
statusFilter.addEventListener("change", renderApplications);
exportBtn.addEventListener("click", exportData);

importInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importData(file);
  importInput.value = "";
});

window.editApplication = editApplication;
window.deleteApplication = deleteApplication;

clearForm();
renderApplications();