// ===== app.js كامل ونهائي =====
const auth = firebase.auth();
const db = firebase.firestore();

// متابعة حالة تسجيل الدخول
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('appDiv').style.display = 'block';
    loadClasses();
  } else {
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('appDiv').style.display = 'none';
  }
});

// تسجيل جديد
function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert('تم التسجيل'))
    .catch(err => alert(err.message));
}

// تسجيل دخول
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
}

// تسجيل خروج
function logout() {
  auth.signOut();
}

// تحميل الصفوف
async function loadClasses() {
  const select = document.getElementById('classSelect');
  select.innerHTML = '<option value="">اختر الصف</option>';
  const snapshot = await db.collection('users').doc(auth.currentUser.uid)
    .collection('classes').get();
  snapshot.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = doc.data().name;
    select.appendChild(option);
  });
}

// إضافة صف جديد
async function addClass() {
  const className = document.getElementById('newClassName').value.trim();
  if (!className) return;
  await db.collection('users').doc(auth.currentUser.uid)
    .collection('classes').add({ name: className });
  document.getElementById('newClassName').value = '';
  loadClasses();
}

// عرض الطلاب عند اختيار الصف
async function showSelectedClass() {
  const classId = document.getElementById('classSelect').value;
  if (!classId) return;
  const container = document.getElementById('studentsContainer');
  container.innerHTML = '';

  // إدخال طالب جديد
  const studentInput = document.createElement('input');
  studentInput.placeholder = "اسم الطالب";
  studentInput.id = `studentInput_${classId}`;
  const addStudentBtn = document.createElement('button');
  addStudentBtn.textContent = "إضافة طالب";
  addStudentBtn.onclick = () => addStudent(classId);
  container.appendChild(studentInput);
  container.appendChild(addStudentBtn);

  // جلب الطلاب من Firebase
  const snapshot = await db.collection('users').doc(auth.currentUser.uid)
    .collection('classes').doc(classId)
    .collection('students').get();

  snapshot.forEach(doc => {
    const student = doc.data();
    const studentDiv = document.createElement('div');
    studentDiv.className = 'student';

    const nameDiv = document.createElement('span');
    nameDiv.className = 'student-name';
    nameDiv.textContent = student.name;

    const waDiv = document.createElement('span');
    waDiv.className = 'student-whatsapp';
    waDiv.textContent = student.whatsapp;
    waDiv.onclick = () => window.open(`https://wa.me/${student.whatsapp}`, '_blank');

    const sessions = student.sessions || [];

    // ===== تقسيم الحصص إلى قديمة وجديدة =====
    const oldDivContainer = document.createElement('div');
    oldDivContainer.className = 'old-sessions-container';
    const newDivContainer = document.createElement('div');
    newDivContainer.className = 'new-sessions-container';

    const newGroupSize = 8; // آخر 8 حصص تعتبر جديدة
    const oldSessions = sessions.slice(0, sessions.length - newGroupSize);
    const newSessions = sessions.slice(sessions.length - newGroupSize);

    // إنشاء الحصص القديمة
    for (let i = 0; i < oldSessions.length; i += 8) {
      const group = oldSessions.slice(i, i + 8);
      const groupDiv = document.createElement('div');
      groupDiv.className = 'old-sessions';
      groupDiv.style.display = 'flex';
      group.forEach(sess => {
        const sDiv = document.createElement('div');
        sDiv.className = 'session ' + sess.status;
        sDiv.textContent = sess.status === 'present' ? 'ح' : 'غ';
        sDiv.onclick = async () => {
          sess.status = sess.status === 'present' ? 'absent' : 'present';
          sDiv.className = 'session ' + sess.status;
          sDiv.textContent = sess.status === 'present' ? 'ح' : 'غ';
          await updateSessions(classId, doc.id, student.sessions);
        };
        const gradeInput = document.createElement('input');
        gradeInput.className = 'session-grade';
        gradeInput.value = sess.grade;
        gradeInput.placeholder = "درجة";
        gradeInput.onchange = () => {
          sess.grade = gradeInput.value;
          updateSessions(classId, doc.id, student.sessions);
        };
        groupDiv.appendChild(sDiv);
        groupDiv.appendChild(gradeInput);
      });
      oldDivContainer.appendChild(groupDiv);
    }

    // إنشاء الحصص الجديدة
    for (let i = 0; i < newSessions.length; i += 8) {
      const group = newSessions.slice(i, i + 8);
      const groupDiv = document.createElement('div');
      groupDiv.className = 'new-sessions-group';
      groupDiv.style.display = 'flex';
      group.forEach(sess => {
        const sDiv = document.createElement('div');
        sDiv.className = 'session ' + sess.status;
        sDiv.textContent = sess.status === 'present' ? 'ح' : 'غ';
        sDiv.onclick = async () => {
          sess.status = sess.status === 'present' ? 'absent' : 'present';
          sDiv.className = 'session ' + sess.status;
          sDiv.textContent = sess.status === 'present' ? 'ح' : 'غ';
          await updateSessions(classId, doc.id, student.sessions);
        };
        const gradeInput = document.createElement('input');
        gradeInput.className = 'session-grade';
        gradeInput.value = sess.grade;
        gradeInput.placeholder = "درجة";
        gradeInput.onchange = () => {
          sess.grade = gradeInput.value;
          updateSessions(classId, doc.id, student.sessions);
        };
        groupDiv.appendChild(sDiv);
        groupDiv.appendChild(gradeInput);
      });
      newDivContainer.appendChild(groupDiv);
    }

    // زر إخفاء/إظهار الحصص القديمة فقط
    const toggleOldBtn = document.createElement('button');
    toggleOldBtn.textContent = 'إخفاء/إظهار الحصص القديمة';
    let showOld = true;
    toggleOldBtn.onclick = () => {
      showOld = !showOld;
      oldDivContainer.querySelectorAll('.old-sessions').forEach(div => {
        div.style.display = showOld ? 'flex' : 'none';
      });
    };

    studentDiv.appendChild(nameDiv);
    studentDiv.appendChild(waDiv);
    studentDiv.appendChild(toggleOldBtn);
    studentDiv.appendChild(oldDivContainer);
    studentDiv.appendChild(newDivContainer);

    // زر إضافة 8 حصص جديدة
    const add8Btn = document.createElement('button');
    add8Btn.textContent = "إضافة 8 حصص جديدة";
    add8Btn.onclick = async () => {
      student.sessions = student.sessions.concat(Array(8).fill({ status: 'absent', grade: '' }));
      await updateSessions(classId, doc.id, student.sessions);
      showSelectedClass();
    };

    // زر حذف الطالب
    const delStudentBtn = document.createElement('button');
    delStudentBtn.textContent = 'حذف الطالب';
    delStudentBtn.onclick = async () => {
      if (confirm("هل تريد حذف هذا الطالب؟")) {
        await db.collection('users').doc(auth.currentUser.uid)
          .collection('classes').doc(classId)
          .collection('students').doc(doc.id).delete();
        showSelectedClass();
      }
    };

    studentDiv.appendChild(add8Btn);
    studentDiv.appendChild(delStudentBtn);

    container.appendChild(studentDiv);
  });
}

// إضافة طالب جديد
async function addStudent(classId) {
  const input = document.getElementById(`studentInput_${classId}`);
  const studentName = input.value.trim();
  if (!studentName) return;
  const whatsappNumber = prompt("ادخل رقم واتساب الطالب");
  await db.collection('users').doc(auth.currentUser.uid)
    .collection('classes').doc(classId)
    .collection('students').add({
      name: studentName,
      whatsapp: whatsappNumber || '',
      sessions: Array(8).fill({ status: 'absent', grade: '' })
    });
  input.value = '';
  showSelectedClass();
}

// تحديث الحصص في Firebase
async function updateSessions(classId, studentId, sessions) {
  await db.collection('users').doc(auth.currentUser.uid)
    .collection('classes').doc(classId)
    .collection('students').doc(studentId).update({ sessions });
}

// البحث عن الطلاب
function searchStudents() {
  const query = document.getElementById('searchStudent').value.trim().toLowerCase();
  document.querySelectorAll('.student').forEach(div => {
    const name = div.querySelector('.student-name').textContent.toLowerCase();
    div.style.display = name.includes(query) ? 'flex' : 'none';
  });
}
