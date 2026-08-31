// =====================================================================
// Adapters — translate between MySQL rows (snake_case, numeric ids) and
// the UI shapes the React pages expect (patient_no as id, joined names).
// Keeping this in one place means pages don't change when data comes
// from the API instead of the demo fixtures.
// =====================================================================

export function patientFromDb(r) {
  return {
    dbId: r.id,
    id: r.patient_no,
    name: `${r.first_name} ${r.last_name}`.trim(),
    dob: (r.dob || '').slice(0, 10),
    gender: r.gender,
    phone: r.phone,
    address: r.address,
    insurance: [r.insurance_type, r.insurance_status].filter(Boolean).join(' · '),
    bloodGroup: r.blood_group,
    genotype: r.genotype,
    nationalId: r.national_id,
    nextOfKin: '',
    emergencyContact: '',
    visitType: 'Walk-in',
    priority: 'Routine',
    doctor: 'Unassigned',
    room: '—',
    arrivalTime: '—',
    waitingMins: 0,
    stage: 'Registration',
    status: 'Registered',
    department: 'OPD',
    registered: r.registered_at,
    visits: [],
  };
}

export function patientToDb(p) {
  const [first, ...rest] = (p.name || '').trim().split(' ');
  const [iType, iStatus] = (p.insurance || 'Cash · Active').split(' · ');
  return {
    hospital_id: 1,
    patient_no: p.id,
    first_name: first || p.name,
    last_name: rest.join(' ') || '-',
    dob: p.dob || null,
    gender: p.gender,
    blood_group: p.bloodGroup && p.bloodGroup !== 'Unknown' ? p.bloodGroup : null,
    genotype: p.genotype && p.genotype !== 'Unknown' ? p.genotype : null,
    national_id: p.nationalId || null,
    phone: p.phone || null,
    address: p.address || null,
    insurance_type: iType || 'Cash',
    insurance_status: iStatus || 'Active',
  };
}

// Payload for the smart POST /api/appointments endpoint (creates invoice too)
export function appointmentToDb(appt, patient, deptId, doctorId) {
  return {
    appointment_no: appt.id,
    patient_id: patient.dbId,
    doctor_employee_id: doctorId || null,
    department_id: deptId || null,
    appt_date: appt.date,
    appt_time: appt.time,
    appt_type: appt.type,
    consultation_fee: 120,
  };
}
