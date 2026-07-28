import app, { PORT } from "./app";
import { connectToMongoDB } from "./database/mongodb";
import { DoctorModel } from "./models/doctor.model";

const SEED_DATA = [
  { code: "derm", name: "Dermatologist", count: 5 },
  { code: "cardio", name: "Cardiologist", count: 5 },
  { code: "neuro", name: "Neurologist", count: 5 },
  { code: "ortho", name: "Orthopedic", count: 5 },
  { code: "peds", name: "Pediatrician", count: 5 },
  { code: "gyno", name: "Gynecologist", count: 5 },
  { code: "ent", name: "ENT", count: 5 },
  { code: "dental", name: "Dentist", count: 5 },
  { code: "ophth", name: "Ophthalmologist", count: 5 },
  { code: "psych", name: "Psychiatrist", count: 5 },
];

async function autoSeedDoctors() {
  const count = await DoctorModel.countDocuments();
  if (count > 0) return;

  console.log("No doctors found — auto-seeding default doctors...");

  const doctors = SEED_DATA.flatMap((spec) =>
    Array.from({ length: spec.count }, (_, i) => ({
      doctorCode: `${spec.code}-${i + 1}`,
      fullName: `Dr. ${spec.name} ${i + 1}`,
      specialization: spec.name,
      experienceYears: 5 + i,
      consultationFee: 1000 + i * 100,
      bio: `${spec.name} specialist`,
      clinic: "General Hospital",
      contactNumber: "+977-9800000000",
      rating: 4.5 + (i % 5) * 0.1,
      availability: "Available today",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      isActive: true,
    }))
  );

  await DoctorModel.insertMany(doctors);
  console.log(`Auto-seeded ${doctors.length} doctors.`);
}

connectToMongoDB().then(() => autoSeedDoctors()).then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
