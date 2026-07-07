const SCHOLARSHIP_COURSES = [
  {
    educationLevel: 'School (Class 1-10)',
    courses: [
      { name: 'General School Education', available: true },
    ],
  },
  {
    educationLevel: '+2 / Higher Secondary',
    courses: [
      { name: 'Science', available: true },
      { name: 'Management', available: true },
      { name: 'Humanities', available: true },
      { name: 'Education', available: false },
    ],
  },
  {
    educationLevel: 'Bachelor',
    courses: [
      { name: 'Engineering', available: true },
      { name: 'Information Technology', available: true },
      { name: 'Agriculture', available: true },
      { name: 'Business Studies', available: true },
      { name: 'Medicine', available: false },
      { name: 'Law', available: false },
      { name: 'Architecture', available: false },
    ],
  },
  {
    educationLevel: 'Master',
    courses: [
      { name: 'Public Health', available: true },
      { name: 'Agriculture', available: true },
      { name: 'Business Administration', available: true },
      { name: 'Engineering', available: false },
      { name: 'Data Science', available: false },
    ],
  },
  {
    educationLevel: 'PhD',
    courses: [
      { name: 'Agricultural Science', available: true },
      { name: 'Climate and Sustainability Research', available: true },
      { name: 'Public Policy Research', available: false },
    ],
  },
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function listScholarships(educationLevel) {
  if (!educationLevel) return SCHOLARSHIP_COURSES;
  return SCHOLARSHIP_COURSES.filter((group) => normalize(group.educationLevel) === normalize(educationLevel));
}

function findCourse(educationLevel, desiredCourse) {
  const group = SCHOLARSHIP_COURSES.find((item) => normalize(item.educationLevel) === normalize(educationLevel));
  if (!group) return null;
  const course = group.courses.find((item) => normalize(item.name) === normalize(desiredCourse));
  if (!course) return null;
  return { educationLevel: group.educationLevel, ...course };
}

function checkScholarshipAvailability(educationLevel, desiredCourse) {
  const course = findCourse(educationLevel, desiredCourse);
  return {
    available: Boolean(course?.available),
    educationLevel: course?.educationLevel || educationLevel || '',
    desiredCourse: course?.name || desiredCourse || '',
    message: course?.available
      ? 'Scholarship is available for this course.'
      : 'Scholarship is not currently available for this course.',
  };
}

module.exports = {
  SCHOLARSHIP_COURSES,
  checkScholarshipAvailability,
  listScholarships,
};
