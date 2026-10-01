const iconMap = { Overview: '▦', Classes: '▧', Attendance: '◷', Assignments: '▤', People: '♧', Reports: '▥', Results: '◒', Notifications: '♢' };
const roleConfig = {
  teacher: { name: 'Alex Morgan', initials: 'AM', label: 'Teacher account', views: ['Overview', 'Classes', 'Attendance', 'Assignments', 'People', 'Reports', 'Notifications'] },
  student: { name: 'Jamie Rivera', initials: 'JR', label: 'Student account', views: ['Overview', 'Classes', 'Assignments', 'Results', 'Notifications'] },
  admin: { name: 'Taylor Brooks', initials: 'TB', label: 'Administrator account', views: ['Overview', 'Classes', 'People', 'Reports', 'Notifications'] }
};
const starterData = {
  classes: [
    { id: 'c1', name: 'Biology · Grade 10', subject: 'Life Sciences', room: 'Room 204', schedule: 'Mon, Wed · 9:00 AM', teacher: 'Alex Morgan', students: 28, color: 'green' },
    { id: 'c2', name: 'Algebra II · Grade 10', subject: 'Mathematics', room: 'Room 108', schedule: 'Tue, Thu · 10:30 AM', teacher: 'Alex Morgan', students: 24, color: 'blue' },
    { id: 'c3', name: 'World History · Grade 9', subject: 'Humanities', room: 'Room 312', schedule: 'Mon, Fri · 1:00 PM', teacher: 'Jordan Lee', students: 31, color: 'coral' },
    { id: 'c4', name: 'Creative Writing · Grade 11', subject: 'Language Arts', room: 'Studio 2', schedule: 'Wed, Fri · 2:00 PM', teacher: 'Alex Morgan', students: 19, color: 'teal' }
  ],
  people: [
    { id: 'p1', name: 'Jamie Rivera', email: 'jamie.rivera@school.edu', role: 'Student', classId: 'c1', initials: 'JR' },
    { id: 'p2', name: 'Sam Chen', email: 'sam.chen@school.edu', role: 'Student', classId: 'c1', initials: 'SC' },
    { id: 'p3', name: 'Mia Patel', email: 'mia.patel@school.edu', role: 'Student', classId: 'c2', initials: 'MP' },
    { id: 'p4', name: 'Jordan Lee', email: 'jordan.lee@school.edu', role: 'Teacher', classId: 'c3', initials: 'JL' },
    { id: 'p5', name: 'Noah Williams', email: 'noah.williams@school.edu', role: 'Student', classId: 'c4', initials: 'NW' },
    { id: 'p6', name: 'Avery Brooks', email: 'avery.brooks@school.edu', role: 'Student', classId: 'c2', initials: 'AB' }
  ],
  assignments: [
    { id: 'a1', title: 'Cell Structure & Function', classId: 'c1', due: '2026-10-05', submissions: 21, total: 28, state: 'Open', detail: 'Label the organelles on the attached cell diagram and explain the function of each.' },
    { id: 'a2', title: 'Quadratic Equations · Problem Set', classId: 'c2', due: '2026-10-07', submissions: 15, total: 24, state: 'Open', detail: 'Solve the practice problems and show each step of your work.' },
    { id: 'a3', title: 'Industrial Revolution Essay', classId: 'c3', due: '2026-10-01', submissions: 25, total: 31, state: 'Open', detail: 'Explain one lasting effect of the Industrial Revolution, using two sources.' },
    { id: 'a4', title: 'A Place I Remember', classId: 'c4', due: '2026-09-27', submissions: 19, total: 19, state: 'Closed', detail: 'Write a descriptive scene grounded in sensory detail.' }
  ],
  attendance: { p1: 'present', p2: 'absent', p3: 'present', p4: 'late', p5: 'present', p6: 'present' },
  grades: { a1: 88, a2: 94 },
  submissions: [],
  notifications: [
    { id: 'n1', title: 'Sam Chen submitted an assignment', detail: 'Cell Structure & Function · Biology · Grade 10', time: '12 minutes ago', read: false, kind: 'submission' },
    { id: 'n2', title: 'Your next class starts soon', detail: 'Algebra II · Room 108 at 10:30 AM', time: '48 minutes ago', read: false, kind: 'class' },
    { id: 'n3', title: 'Assignment deadline approaching', detail: 'Industrial Revolution Essay · Due today', time: 'Yesterday', read: true, kind: 'deadline' },
    { id: 'n4', title: 'Attendance has been recorded', detail: 'Biology · Grade 10 · 26 of 28 students present', time: 'Yesterday', read: true, kind: 'attendance' }
  ]
};
const storageKey = 'classroom-workspace-v1';
let state = loadState();
let currentRole = 'teacher';
let currentView = 'Overview';
let currentFilter = 'All';
let peopleFilter = 'All';

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.classes && saved.people && saved.assignments) return { ...structuredClone(starterData), ...saved };
  } catch (error) { console.warn('Could not load saved workspace data.', error); }
  return structuredClone(starterData);
}
function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
function formatDate(dateString, options = { month: 'short', day: 'numeric' }) {
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat('en', options).format(date);
}
function relativeDue(dateString) {
  const date = new Date(`${dateString}T23:59:00`);
  const days = Math.ceil((date - new Date()) / 86400000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
function getClass(classId) { return state.classes.find(item => item.id === classId); }
function getClassName(classId) { return getClass(classId)?.name || 'Unassigned'; }
function getStudentClasses() {
  const student = state.people.find(person => person.id === 'p1');
  const classIds = student?.classIds || (student?.classId ? [student.classId] : []);
  return state.classes.filter(klass => classIds.includes(klass.id));
}
function getInitials(name) { return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }
function notify(title, detail, kind = 'update') {
  state.notifications.unshift({ id: `n${Date.now()}`, title, detail, time: 'Just now', read: false, kind });
  saveState();
  updateNotificationDot();
}
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast'; toast.textContent = message;
  document.getElementById('toast-region').append(toast);
  window.setTimeout(() => toast.remove(), 2800);
}
function updateNotificationDot() { document.getElementById('notification-dot').hidden = !state.notifications.some(item => !item.read); }
function setupShell() {
  const today = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  document.getElementById('today-label').textContent = today;
  const switchRole = role => {
    currentRole = role;
    document.getElementById('role-switch').value = role;
    document.getElementById('mobile-role-switch').value = role;
    const person = roleConfig[currentRole];
    document.getElementById('profile-name').textContent = person.name;
    document.getElementById('profile-role').textContent = person.label;
    document.querySelector('.profile-button .avatar').textContent = person.initials;
    document.querySelector('.profile-button .avatar').className = `avatar ${currentRole === 'teacher' ? 'avatar-plum' : currentRole === 'student' ? 'avatar-blue' : 'avatar-green'}`;
    currentView = 'Overview';
    render();
  };
  document.getElementById('role-switch').addEventListener('change', event => switchRole(event.target.value));
  document.getElementById('mobile-role-switch').addEventListener('change', event => switchRole(event.target.value));
  document.getElementById('navigation').addEventListener('click', event => {
    const button = event.target.closest('[data-view]');
    if (button) navigate(button.dataset.view);
  });
  document.querySelector('.notification-trigger').addEventListener('click', () => navigate('Notifications'));
  document.getElementById('global-search').addEventListener('input', event => {
    const value = event.target.value.trim();
    if (!value) return;
    const match = roleConfig[currentRole].views.find(view => view.toLowerCase().includes(value.toLowerCase()));
    if (match) navigate(match);
    else if (['Classes', 'People', 'Assignments'].includes(currentView)) render();
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('global-search').focus(); }
  });
  document.getElementById('page-content').addEventListener('click', handlePageAction);
  document.getElementById('page-content').addEventListener('change', handlePageChange);
  document.getElementById('page-content').addEventListener('input', event => {
    if (event.target.matches('[data-table-search]')) filterVisibleRows(event.target.value);
  });
  document.getElementById('dialog-form').addEventListener('submit', handleDialogSubmit);
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById('app-dialog').close()));
  document.getElementById('app-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  updateNotificationDot();
  render();
}
function navigate(view) {
  if (!roleConfig[currentRole].views.includes(view)) return;
  currentView = view; currentFilter = 'All';
  document.getElementById('global-search').value = '';
  render();
}
function render() {
  const views = roleConfig[currentRole].views;
  document.getElementById('navigation').innerHTML = views.map(view => `<button class="nav-item ${view === currentView ? 'active' : ''}" type="button" data-view="${view}"><span class="nav-icon" aria-hidden="true">${iconMap[view]}</span><span class="nav-label">${view}</span>${view === 'Notifications' && state.notifications.some(item => !item.read) ? '<span class="nav-count">' + state.notifications.filter(item => !item.read).length + '</span>' : ''}</button>`).join('');
  document.getElementById('page-name').textContent = currentView;
  const page = document.getElementById('page-content');
  const viewsByName = { Overview: renderOverview, Classes: renderClasses, Attendance: renderAttendance, Assignments: renderAssignments, People: renderPeople, Reports: renderReports, Results: renderResults, Notifications: renderNotifications };
  page.innerHTML = viewsByName[currentView]();
  if (currentView === 'Notifications') { state.notifications.forEach(item => { item.read = true; }); saveState(); updateNotificationDot(); document.getElementById('navigation').querySelector('.nav-item.active')?.querySelector('.nav-count')?.remove(); }
}
function pageHeading(title, description, action = '') {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ''}</div>`;
}
function metric(label, value, foot, symbol, up = '') {
  return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-symbol" aria-hidden="true">${symbol}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${up ? `<span class="metric-up">${up}</span>` : ''}${foot}</div></article>`;
}
function panelHeader(title, subtitle = '', action = '') {
  return `<div class="panel-header"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${action}</div>`;
}
function chartMarkup() {
  const values = [[45, 66], [58, 73], [52, 63], [72, 78], [65, 71], [81, 88], [69, 83], [76, 91]];
  return `<div class="chart-wrap"><div class="chart-legend"><span class="legend-key"><i class="legend-dot"></i> Attendance</span><span class="legend-key"><i class="legend-dot blue"></i> Assignment completion</span></div><div class="chart"><div class="y-labels"><span>100</span><span>75</span><span>50</span><span>25</span></div><div class="chart-main"><div class="chart-grid">${values.map(([a,b]) => `<div class="chart-group"><i class="chart-bar" style="height:${a}%"></i><i class="chart-bar blue" style="height:${b}%"></i></div>`).join('')}</div><div class="chart-months"><span>Aug 18</span><span>Aug 25</span><span>Sep 01</span><span>Sep 08</span><span>Sep 15</span><span>Sep 22</span><span>Sep 29</span><span>Oct 06</span></div></div></div></div>`;
}
function upcomingSchedule() {
  const entries = currentRole === 'student' ? [['09:00','Biology · Grade 10','Room 204','Today'],['10:30','Algebra II · Grade 10','Room 108','Today'],['01:00','Study group','Library · East wing','Today']] : [['09:00','Biology · Grade 10','Room 204','Today'],['10:30','Algebra II · Grade 10','Room 108','Today'],['01:00','World History · Grade 9','Room 312','Tomorrow']];
  return `<div class="schedule-list">${entries.map(([time,title,room,tag]) => `<div class="schedule-item"><span class="schedule-time">${time}</span><div><strong>${title}</strong><small>${room}</small></div><span class="schedule-tag">${tag}</span></div>`).join('')}</div>`;
}
function recentActivity() {
  const items = state.notifications.slice(0, 3);
  if (!items.length) return '<div class="empty-state">Nothing new to catch up on.</div>';
  return `<div class="activity-list">${items.map((item, index) => `<div class="activity-item"><span class="activity-avatar ${index === 1 ? 'green' : index === 2 ? 'blue' : ''}">${item.kind === 'submission' ? 'SC' : item.kind === 'class' ? 'AR' : 'AM'}</span><div class="activity-copy"><strong>${escapeHTML(item.title.split(' ').slice(0,2).join(' '))}</strong> ${escapeHTML(item.title.split(' ').slice(2).join(' '))}<small>${escapeHTML(item.detail)} · ${escapeHTML(item.time)}</small></div></div>`).join('')}</div>`;
}
function assignmentRows(items, student = false) {
  return items.map(item => {
    const klass = getClass(item.classId);
    const due = relativeDue(item.due);
    const submission = state.submissions.find(entry => entry.assignmentId === item.id && entry.personId === 'p1');
    const status = student ? (submission ? 'Submitted' : due === 'Overdue' || item.state !== 'Open' ? 'Closed' : 'To do') : item.state;
    const statusClass = status === 'Open' || status === 'To do' ? 'pending' : status === 'Closed' ? 'closed' : status === 'Submitted' ? 'submitted' : '';
    const action = student ? status === 'Closed' ? '<button type="button" class="button button-small button-quiet" disabled>Closed</button>' : `<button type="button" class="button button-small ${submission ? 'button-quiet' : 'button-lime'}" data-action="${submission ? 'view-submission' : 'submit-assignment'}" data-id="${item.id}">${submission ? 'View work' : 'Submit work'}</button>` : `<button type="button" class="button button-small button-quiet" data-action="grade-assignment" data-id="${item.id}">Review work</button>`;
    return `<article class="assignment-card"><span class="assignment-icon" aria-hidden="true">▤</span><div class="assignment-info"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(klass?.name || 'Unassigned')} · ${escapeHTML(klass?.teacher || roleConfig[currentRole].name)}</p><div class="assignment-meta"><span>${student ? escapeHTML(due) : `${item.submissions} / ${item.total} submitted`}</span><span>Due ${formatDate(item.due)}</span>${state.grades[item.id] ? `<span>Grade: ${state.grades[item.id]}%</span>` : ''}</div></div><div class="assignment-actions"><span class="status ${statusClass}">${status}</span>${action}</div></article>`;
  }).join('');
}
function renderOverview() {
  const isStudent = currentRole === 'student';
  const isAdmin = currentRole === 'admin';
  const visibleClasses = isStudent ? getStudentClasses() : state.classes;
  const classCount = visibleClasses.length;
  const peopleCount = state.people.filter(person => person.role === 'Student').length;
  const assignmentCount = state.assignments.filter(item => item.state === 'Open').length;
  const openTasks = state.assignments.filter(item => (!isStudent || visibleClasses.some(klass => klass.id === item.classId)) && item.state === 'Open' && relativeDue(item.due) !== 'Overdue' && !state.submissions.some(entry => entry.assignmentId === item.id && entry.personId === 'p1')).length;
  const action = currentRole === 'teacher' ? '<button class="button button-primary" data-action="open-assignment">＋ Create assignment</button>' : currentRole === 'admin' ? '<button class="button button-primary" data-action="open-person">＋ Add a person</button>' : '<button class="button button-primary" data-view="Assignments">View assignments <span>→</span></button>';
  const heading = pageHeading(isStudent ? 'Good morning, Jamie' : isAdmin ? 'Your school, at a glance' : 'Good morning, Alex', isStudent ? 'Here’s what’s happening in your learning today.' : isAdmin ? 'A clear view of classes, people, and learning.' : 'Here’s the latest across your classroom.', action);
  const metrics = isStudent ? metric('Enrolled classes', classCount, 'This term', '▧') + metric('Attendance this term', '96%', 'Across all classes', '◷', '+2%') + metric('Open assignments', openTasks, 'Waiting for your work', '▤') + metric('Current average', '91%', 'Across graded work', '◒', '+4%') : isAdmin ? metric('Active students', peopleCount, 'Across all classes', '♧', '+8') + metric('Teachers', state.people.filter(person => person.role === 'Teacher').length + 1, 'On your school roster', '♙') + metric('Active classes', classCount, 'This term', '▧') + metric('Open assignments', assignmentCount, 'Across all classes', '▤') : metric('Total students', peopleCount, 'Across your classes', '♧', '+12%') + metric('Active classes', classCount, 'This semester', '▧') + metric('Assignments', assignmentCount, 'Currently in progress', '▤', '+3') + metric('Avg. attendance', `${attendanceRate()}%`, 'Across your classes', '◷', '+4.2%');
  const classes = visibleClasses.slice(0, 4);
  const classRows = classes.map(klass => `<tr><td><span class="class-cell"><i class="class-color ${klass.color === 'green' ? '' : klass.color}"></i>${escapeHTML(klass.name)}</span></td><td>${escapeHTML(klass.schedule.split('·')[0].trim())}</td><td>${klass.students} students</td><td><span class="status">Active</span></td></tr>`).join('');
  return `${heading}<div class="metric-grid">${metrics}</div><div class="dashboard-grid"><section class="panel">${panelHeader('Learning snapshot','Attendance and assignment completion over time','<button class="text-link" data-view="Reports">Full report →</button>')}${chartMarkup()}</section><section class="panel">${panelHeader('Coming up','Your schedule at a glance')} ${upcomingSchedule()}</section></div><div class="lower-grid"><section class="panel">${panelHeader(isStudent ? 'Your classes' : 'Your classes','A quick look at this week','<button class="text-link" data-view="Classes">View all →</button>')}<div class="table-wrap"><table class="data-table"><thead><tr><th>CLASS</th><th>SCHEDULE</th><th>ENROLLMENT</th><th>STATUS</th></tr></thead><tbody>${classRows || '<tr><td colspan="4" class="empty-state">No classes yet.</td></tr>'}</tbody></table></div></section><section class="panel">${panelHeader(isStudent ? 'Recent updates' : 'Recent activity','','<button class="text-link" data-view="Notifications">See all →</button>')}${recentActivity()}</section></div>`;
}
function classCard(klass) {
  const people = state.people.filter(person => person.classId === klass.id).slice(0, 3);
  const colors = ['avatar-plum', 'avatar-blue', 'avatar-green'];
  return `<article class="class-card"><div class="class-band ${klass.color === 'green' ? '' : klass.color}"></div><div class="class-card-body"><div class="class-card-top"><div><h3>${escapeHTML(klass.name)}</h3><p>${escapeHTML(klass.subject)} · ${escapeHTML(klass.room)}</p></div><span class="class-initial">${escapeHTML(klass.name.split(/[ ·]/)[0].slice(0,2).toUpperCase())}</span></div><div class="class-card-meta"><span>Students<strong>${klass.students}</strong></span><span>Schedule<strong>${escapeHTML(klass.schedule.split('·').slice(-1)[0].trim())}</strong></span><span>Teacher<strong>${escapeHTML(klass.teacher.split(' ')[0])}</strong></span></div><div class="class-card-footer"><span class="avatar-stack">${people.map((person, index) => `<i class="avatar ${colors[index % colors.length]}">${escapeHTML(person.initials)}</i>`).join('')}</span><button class="text-link" data-action="view-class" data-id="${klass.id}">Open class →</button></div></div></article>`;
}
function renderClasses() {
  const action = currentRole !== 'student' ? '<button class="button button-primary" data-action="open-class">＋ Create class</button>' : '';
  const visibleClasses = currentRole === 'student' ? getStudentClasses() : state.classes;
  return `${pageHeading(currentRole === 'student' ? 'My classes' : 'Classes', currentRole === 'student' ? 'Your schedule and class spaces for this term.' : 'Build a connected classroom for every learner.', action)}<div class="section-toolbar"><div class="filter-tabs"><button class="filter-tab active" data-filter="All">All classes <span>${visibleClasses.length}</span></button><button class="filter-tab" data-filter="My classes">My classes</button></div><input class="toolbar-search" data-table-search placeholder="Search classes..." aria-label="Search classes"></div><div class="class-grid">${visibleClasses.map(classCard).join('') || '<div class="panel empty-state">No classes match your search.</div>'}</div>`;
}
function attendanceRate() {
  const values = Object.values(state.attendance);
  return values.length ? Math.round(values.filter(value => value === 'present' || value === 'late').length / values.length * 100) : 0;
}
function renderAttendance() {
  const people = state.people.filter(person => person.role === 'Student');
  const present = Object.values(state.attendance).filter(value => value === 'present').length;
  const absent = Object.values(state.attendance).filter(value => value === 'absent').length;
  const late = Object.values(state.attendance).filter(value => value === 'late').length;
  return `${pageHeading('Attendance','Track attendance and keep your class records in one place.',`<button class="button button-quiet" data-action="export-attendance">↓ Export</button><button class="button button-primary" data-action="save-attendance">Save attendance</button>`)}<div class="section-toolbar"><div class="filter-tabs"><button class="filter-tab active" data-attendance-class="All">All classes</button>${state.classes.slice(0, 3).map(klass => `<button class="filter-tab" data-attendance-class="${klass.id}">${escapeHTML(klass.name.split(' ·')[0])}</button>`).join('')}</div><input type="date" class="toolbar-search" value="${new Date().toISOString().slice(0,10)}" aria-label="Attendance date" data-attendance-date></div><div class="attendance-summary"><div class="attendance-stat"><span>Present today</span><strong>${present}</strong></div><div class="attendance-stat"><span>Absent today</span><strong>${absent}</strong></div><div class="attendance-stat"><span>Arrived late</span><strong>${late}</strong></div></div><section class="panel"><div class="table-wrap"><table class="data-table" id="attendance-table"><thead><tr><th>STUDENT</th><th>CLASS</th><th>ATTENDANCE</th></tr></thead><tbody>${people.map(person => `<tr data-person-row data-class-id="${person.classId}"><td><span class="person-cell"><i class="avatar ${person.id === 'p1' ? 'avatar-plum' : 'avatar-blue'}">${escapeHTML(person.initials)}</i><span><strong>${escapeHTML(person.name)}</strong><small>${escapeHTML(person.email)}</small></span></span></td><td>${escapeHTML(getClassName(person.classId))}</td><td><span class="attendance-control" data-person-id="${person.id}">${['present','absent','late'].map(status => `<button type="button" class="${state.attendance[person.id] === status ? `selected ${status}` : ''}" data-action="set-attendance" data-status="${status}" data-person="${person.id}">${status[0].toUpperCase()}${status.slice(1)}</button>`).join('')}</span></td></tr>`).join('')}</tbody></table></div></section>`;
}
function renderAssignments() {
  const student = currentRole === 'student';
  const action = !student ? '<button class="button button-primary" data-action="open-assignment">＋ Create assignment</button>' : '';
  const items = [...state.assignments].filter(item => !student || getStudentClasses().some(klass => klass.id === item.classId)).sort((a,b) => new Date(a.due) - new Date(b.due));
  const statuses = student ? ['All', 'To do', 'Submitted', 'Closed'] : ['All', 'Open', 'Closed'];
  const list = currentFilter === 'All' ? items : items.filter(item => {
    if (student) {
      const submitted = state.submissions.some(entry => entry.assignmentId === item.id && entry.personId === 'p1');
      if (currentFilter === 'Submitted') return submitted;
      if (currentFilter === 'Closed') return !submitted && (item.state !== 'Open' || relativeDue(item.due) === 'Overdue');
      return !submitted && item.state === 'Open' && relativeDue(item.due) !== 'Overdue';
    }
    return item.state === currentFilter;
  });
  return `${pageHeading(student ? 'Assignments' : 'Assignments & quizzes', student ? 'All the work assigned to your classes.' : 'Create work, set deadlines, and review submissions.', action)}<div class="section-toolbar"><div class="filter-tabs">${statuses.map(status => `<button class="filter-tab ${currentFilter === status ? 'active' : ''}" data-assignment-filter="${status}">${status}</button>`).join('')}</div><input class="toolbar-search" data-table-search placeholder="Search assignments..." aria-label="Search assignments"></div><div class="assignment-list">${list.length ? assignmentRows(list, student) : '<div class="panel empty-state">No assignments here yet.</div>'}</div>`;
}
function renderPeople() {
  const filtered = state.people.filter(person => peopleFilter === 'All' || person.role === peopleFilter);
  const roleOptions = currentRole === 'admin' ? ['Student','Teacher'] : ['Student'];
  return `${pageHeading(currentRole === 'admin' ? 'People' : 'Your students', currentRole === 'admin' ? 'Manage the people who make your school.' : 'Your class roster, all in one place.', `<button class="button button-primary" data-action="open-person">＋ Add ${currentRole === 'admin' ? 'person' : 'student'}</button>`)}<div class="section-toolbar"><div class="filter-tabs">${['All', ...roleOptions].map(role => `<button class="filter-tab ${peopleFilter === role ? 'active' : ''}" data-people-filter="${role}">${role === 'All' ? `Everyone (${filtered.length})` : role + 's'}</button>`).join('')}</div><input class="toolbar-search" data-table-search placeholder="Search people..." aria-label="Search people"></div><section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>PERSON</th><th>ROLE</th><th>CLASS</th><th>STATUS</th><th></th></tr></thead><tbody>${filtered.map(person => `<tr data-search-row><td><span class="person-cell"><i class="avatar ${person.role === 'Teacher' ? 'avatar-green' : person.id === 'p1' ? 'avatar-plum' : 'avatar-blue'}">${escapeHTML(person.initials)}</i><span><strong>${escapeHTML(person.name)}</strong><small>${escapeHTML(person.email)}</small></span></span></td><td>${person.role}</td><td>${escapeHTML(getClassName(person.classId))}</td><td><span class="status">Active</span></td><td><button class="text-link" data-action="remove-person" data-id="${person.id}">Remove</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty-state">No people match this filter.</td></tr>'}</tbody></table></div></section>`;
}
function renderReports() {
  const rate = attendanceRate();
  const students = state.people.filter(person => person.role === 'Student');
  const gradedAverage = Object.values(state.grades).length ? Math.round(Object.values(state.grades).reduce((sum, grade) => sum + grade, 0) / Object.values(state.grades).length) : 0;
  return `${pageHeading('Reports & insights','A snapshot of learning progress across your school.','<button class="button button-quiet" data-action="export-report">↓ Export report</button>')}<div class="report-grid"><section class="report-highlight"><div><h2>Students are showing up and moving forward.</h2><p>Attendance and completed work are trending in the right direction.</p></div><div class="report-number">${rate}%<small>attendance rate</small></div></section><section class="report-mini"><h3>Class health</h3><div class="progress-row"><div class="progress-label"><span>Average attendance</span><strong>${rate}%</strong></div><div class="progress-track"><span style="width:${rate}%"></span></div></div><div class="progress-row"><div class="progress-label"><span>Assignment completion</span><strong>${completionRate()}%</strong></div><div class="progress-track"><span style="width:${completionRate()}%;background:#8189e7"></span></div></div><div class="progress-row"><div class="progress-label"><span>Average grade</span><strong>${gradedAverage}%</strong></div><div class="progress-track"><span style="width:${gradedAverage}%;background:#f49a81"></span></div></div></section></div><div class="lower-grid"><section class="panel">${panelHeader('Class performance','Enrollment and engagement by class')}<div class="table-wrap"><table class="data-table"><thead><tr><th>CLASS</th><th>STUDENTS</th><th>ATTENDANCE</th><th>ASSIGNMENTS</th></tr></thead><tbody>${state.classes.map(klass => `<tr><td><strong>${escapeHTML(klass.name)}</strong></td><td>${klass.students}</td><td>${rate}%</td><td>${state.assignments.filter(item => item.classId === klass.id).length} active</td></tr>`).join('')}</tbody></table></div></section><section class="panel">${panelHeader('Student highlights','Keep an eye on these learners')}<div class="activity-list">${students.slice(0,4).map((person,index) => `<div class="activity-item"><span class="activity-avatar ${index % 2 ? 'green' : 'blue'}">${escapeHTML(person.initials)}</span><div class="activity-copy"><strong>${escapeHTML(person.name)}</strong><small>${escapeHTML(getClassName(person.classId))} · ${state.attendance[person.id] === 'absent' ? 'Attendance follow-up' : 'On track this week'}</small></div></div>`).join('')}</div></section></div>`;
}
function completionRate() {
  const total = state.assignments.reduce((sum, item) => sum + item.total, 0);
  const submissions = state.assignments.reduce((sum, item) => sum + item.submissions, 0);
  return total ? Math.round(submissions / total * 100) : 0;
}
function renderResults() {
  const graded = state.assignments.filter(item => state.grades[item.id] !== undefined);
  return `${pageHeading('Results & grades','Your feedback, scores, and progress in one place.')}<div class="metric-grid">${metric('Current average', `${graded.length ? Math.round(graded.reduce((sum,item) => sum + state.grades[item.id],0) / graded.length) : 0}%`, 'Across graded work','◒')}${metric('Assignments graded',graded.length,'This term','▤')}${metric('Attendance',`${attendanceRate()}%`,'This term','◷')}${metric('Classes enrolled',state.classes.length,'This term','▧')}</div><section class="panel">${panelHeader('Your grades','Scores and teacher feedback')}<div class="table-wrap"><table class="data-table"><thead><tr><th>ASSIGNMENT</th><th>CLASS</th><th>SUBMITTED</th><th>GRADE</th><th>FEEDBACK</th></tr></thead><tbody>${graded.map(item => `<tr><td><strong>${escapeHTML(item.title)}</strong></td><td>${escapeHTML(getClassName(item.classId))}</td><td>${formatDate(item.due)}</td><td><span class="status">${state.grades[item.id]}%</span></td><td>Great work. Keep it up!</td></tr>`).join('') || '<tr><td colspan="5" class="empty-state">Your grades will appear here when work is reviewed.</td></tr>'}</tbody></table></div></section>`;
}
function renderNotifications() {
  return `${pageHeading('Notifications','The latest updates from your classes and school.','<button class="button button-quiet" data-action="mark-all-read">Mark all as read</button>')}<section class="panel notification-list">${state.notifications.length ? state.notifications.map(item => `<article class="notification-row ${item.read ? '' : 'unread'}"><span class="notification-mark" aria-hidden="true">${item.kind === 'submission' ? '▤' : item.kind === 'class' ? '▧' : item.kind === 'attendance' ? '◷' : '♢'}</span><div class="notification-copy"><strong>${escapeHTML(item.title)}</strong><br>${escapeHTML(item.detail)}<small>${escapeHTML(item.time)}</small></div>${item.read ? '' : '<i class="read-dot"></i>'}</article>`).join('') : '<div class="empty-state">You are all caught up.</div>'}</section>`;
}
function handlePageChange(event) {
  const target = event.target;
  if (target.matches('[data-role-person]')) {
    const classField = document.querySelector('[name="person-class"]');
    if (classField) classField.disabled = target.value === 'Teacher';
  }
}
function filterVisibleRows(value) {
  const query = value.trim().toLowerCase();
  document.querySelectorAll('[data-search-row], .class-card').forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
}
function handlePageAction(event) {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { navigate(viewButton.dataset.view); return; }
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) {
    currentFilter = filterButton.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button === filterButton));
    return;
  }
  const peopleButton = event.target.closest('[data-people-filter]');
  if (peopleButton) { peopleFilter = peopleButton.dataset.peopleFilter; render(); return; }
  const assignmentFilter = event.target.closest('[data-assignment-filter]');
  if (assignmentFilter) { currentFilter = assignmentFilter.dataset.assignmentFilter; render(); return; }
  const attendanceFilter = event.target.closest('[data-attendance-class]');
  if (attendanceFilter) {
    document.querySelectorAll('[data-attendance-class]').forEach(button => button.classList.toggle('active', button === attendanceFilter));
    document.querySelectorAll('[data-person-row]').forEach(row => { row.hidden = attendanceFilter.dataset.attendanceClass !== 'All' && row.dataset.classId !== attendanceFilter.dataset.attendanceClass; });
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const { action, id, status, person } = actionButton.dataset;
  if (action === 'open-class') openDialog('class');
  if (action === 'open-assignment') openDialog('assignment');
  if (action === 'open-person') openDialog('person');
  if (action === 'remove-person') removePerson(id);
  if (action === 'set-attendance') { state.attendance[person] = status; render(); }
  if (action === 'save-attendance') { saveState(); notify('Attendance has been recorded', `${new Date().toLocaleDateString()} · ${attendanceRate()}% present`, 'attendance'); showToast('Attendance saved for today.'); }
  if (action === 'submit-assignment') openDialog('submission', id);
  if (action === 'view-submission') showSubmission(id);
  if (action === 'grade-assignment') openDialog('grade', id);
  if (action === 'mark-all-read') { state.notifications.forEach(item => { item.read = true; }); saveState(); render(); showToast('All notifications marked as read.'); }
  if (action === 'export-report' || action === 'export-attendance') exportCSV(action === 'export-report' ? 'learning-report.csv' : 'attendance.csv');
  if (action === 'view-class') showToast(`${getClass(id)?.name || 'Class'} roster is ready.`);
}
function openDialog(type, id = '') {
  const dialog = document.getElementById('app-dialog');
  const fields = document.getElementById('dialog-fields');
  const title = document.getElementById('dialog-title');
  const eyebrow = document.getElementById('dialog-eyebrow');
  const submit = document.getElementById('dialog-submit');
  const assignmentOptions = state.classes.map(klass => `<option value="${klass.id}">${escapeHTML(klass.name)}</option>`).join('');
  const configs = {
    class: ['CREATE A CLASS', 'Create a class', 'Create class', `<div class="form-field full"><label for="class-name">Class name</label><input id="class-name" name="class-name" required placeholder="e.g. Biology · Grade 10"></div><div class="form-field"><label for="class-subject">Subject</label><input id="class-subject" name="class-subject" required placeholder="Life Sciences"></div><div class="form-field"><label for="class-room">Room</label><input id="class-room" name="class-room" placeholder="Room 204"></div><div class="form-field full"><label for="class-schedule">Schedule</label><input id="class-schedule" name="class-schedule" placeholder="Mon, Wed · 9:00 AM"></div>`],
    assignment: ['NEW ASSIGNMENT', 'Create an assignment', 'Create assignment', `<div class="form-field full"><label for="assignment-title">Assignment title</label><input id="assignment-title" name="assignment-title" required placeholder="e.g. Chapter 4 review"></div><div class="form-field"><label for="assignment-class">Class</label><select id="assignment-class" name="assignment-class" required>${assignmentOptions}</select></div><div class="form-field"><label for="assignment-due">Due date</label><input id="assignment-due" name="assignment-due" type="date" required min="${new Date().toISOString().slice(0,10)}"></div><div class="form-field full"><label for="assignment-detail">Instructions</label><textarea id="assignment-detail" name="assignment-detail" placeholder="Share what students need to know..."></textarea></div>`],
    person: ['ADD TO YOUR SCHOOL', currentRole === 'admin' ? 'Add a person' : 'Add a student', 'Add person', `<div class="form-field full"><label for="person-name">Full name</label><input id="person-name" name="person-name" required placeholder="Student name"></div><div class="form-field full"><label for="person-email">Email address</label><input id="person-email" name="person-email" type="email" required placeholder="name@school.edu"></div><div class="form-field"><label for="person-role">Role</label><select id="person-role" name="person-role" data-role-person>${(currentRole === 'admin' ? ['Student','Teacher'] : ['Student']).map(role => `<option>${role}</option>`).join('')}</select></div><div class="form-field"><label for="person-class">Class</label><select id="person-class" name="person-class"><option value="">Choose class</option>${assignmentOptions}</select></div>`],
    submission: ['YOUR WORK', 'Submit assignment', 'Submit work', `<div class="form-field full"><label for="submission-note">Your response</label><textarea id="submission-note" name="submission-note" required placeholder="Write your response or share a link to your work..."></textarea></div><div class="form-field full"><label for="submission-file">Attach a file (optional)</label><input id="submission-file" name="submission-file" type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg"></div>`],
    grade: ['REVIEW SUBMISSION', 'Grade assignment', 'Save grade', `<div class="form-field"><label for="grade-score">Score (%)</label><input id="grade-score" name="grade-score" type="number" min="0" max="100" required value="88"></div><div class="form-field"><label for="grade-student">Student</label><select id="grade-student" name="grade-student">${state.people.filter(person => person.role === 'Student').map(person => `<option value="${person.id}">${escapeHTML(person.name)}</option>`).join('')}</select></div><div class="form-field full"><label for="grade-feedback">Feedback</label><textarea id="grade-feedback" name="grade-feedback" placeholder="Share a note with your student..."></textarea></div>`]
  };
  const config = configs[type];
  title.textContent = config[1]; eyebrow.textContent = config[0]; submit.innerHTML = `${config[2]} <span aria-hidden="true">→</span>`; fields.innerHTML = config[3];
  document.getElementById('dialog-form').dataset.type = type;
  document.getElementById('dialog-form').dataset.id = id;
  dialog.showModal();
}
function handleDialogSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const type = form.dataset.type;
  if (type === 'class') {
    const name = data.get('class-name').trim();
    state.classes.push({ id: `c${Date.now()}`, name, subject: data.get('class-subject').trim(), room: data.get('class-room').trim() || 'TBD', schedule: data.get('class-schedule').trim() || 'Schedule TBD', teacher: roleConfig[currentRole].name, students: 0, color: ['green','blue','coral','teal'][state.classes.length % 4] });
    notify('A new class is ready', `${name} · ${roleConfig[currentRole].name}`, 'class');
    finishDialog('Class created. Your new class is ready.');
  } else if (type === 'assignment') {
    const assignment = { id: `a${Date.now()}`, title: data.get('assignment-title').trim(), classId: data.get('assignment-class'), due: data.get('assignment-due'), submissions: 0, total: getClass(data.get('assignment-class'))?.students || 0, state: 'Open', detail: data.get('assignment-detail').trim() };
    state.assignments.unshift(assignment);
    notify('A new assignment is available', `${assignment.title} · ${getClassName(assignment.classId)} · Due ${formatDate(assignment.due)}`, 'deadline');
    finishDialog('Assignment published to your class.');
  } else if (type === 'person') {
    const role = data.get('person-role');
    const selectedClass = role === 'Teacher' ? '' : data.get('person-class');
    const name = data.get('person-name').trim();
    const person = { id: `p${Date.now()}`, name, email: data.get('person-email').trim(), role, classId: selectedClass, initials: getInitials(name) };
    state.people.push(person);
    if (selectedClass) { const klass = getClass(selectedClass); if (klass) klass.students++; }
    notify(role === 'Teacher' ? 'A new teacher joined your school' : 'A student was added to your class', `${name}${selectedClass ? ` · ${getClassName(selectedClass)}` : ''}`, 'class');
    finishDialog(`${name} has been added.`);
  } else if (type === 'submission') {
    const assignmentId = form.dataset.id;
    const assignment = state.assignments.find(item => item.id === assignmentId);
    if (assignment && assignment.state === 'Open' && relativeDue(assignment.due) !== 'Overdue') {
      state.submissions.push({ assignmentId, personId: 'p1', response: data.get('submission-note').trim(), fileName: data.get('submission-file')?.name || '', submittedAt: new Date().toISOString() });
      assignment.submissions++;
      notify('Your assignment was submitted', `${assignment.title} · ${getClassName(assignment.classId)}`, 'submission');
      finishDialog('Your work has been submitted.');
    } else { document.getElementById('app-dialog').close(); showToast('This assignment is closed.'); }
  } else if (type === 'grade') {
    const assignmentId = form.dataset.id;
    state.grades[assignmentId] = Number(data.get('grade-score'));
    const assignment = state.assignments.find(item => item.id === assignmentId);
    notify('A new result is ready', `${assignment?.title || 'Assignment'} · ${state.grades[assignmentId]}%`, 'result');
    finishDialog('Grade saved. The student can see their result.');
  }
}
function finishDialog(message) {
  saveState(); document.getElementById('app-dialog').close(); render(); showToast(message);
}
function removePerson(id) {
  const person = state.people.find(item => item.id === id);
  if (!person) return;
  if (!window.confirm(`Remove ${person.name} from this workspace?`)) return;
  state.people = state.people.filter(item => item.id !== id);
  if (person.classId) { const klass = getClass(person.classId); if (klass && person.role === 'Student') klass.students = Math.max(0, klass.students - 1); }
  delete state.attendance[id];
  saveState(); render(); showToast(`${person.name} was removed.`);
}
function showSubmission(id) {
  const submission = state.submissions.find(item => item.assignmentId === id && item.personId === 'p1');
  if (!submission) return;
  window.alert(`Submitted ${new Date(submission.submittedAt).toLocaleString()}\n\n${submission.response}${submission.fileName ? `\n\nAttachment: ${submission.fileName}` : ''}`);
}
function exportCSV(filename) {
  let rows;
  if (filename === 'attendance.csv') rows = [['Student','Class','Status'], ...state.people.filter(person => person.role === 'Student').map(person => [person.name, getClassName(person.classId), state.attendance[person.id] || 'unmarked'])];
  else rows = [['Class','Subject','Students','Attendance rate','Active assignments'], ...state.classes.map(klass => [klass.name, klass.subject, klass.students, `${attendanceRate()}%`, state.assignments.filter(item => item.classId === klass.id && item.state === 'Open').length])];
  const content = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); showToast('Your CSV report has been exported.');
}
setupShell();
