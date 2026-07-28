import mongoose from "mongoose";
import { DoctorModel } from "../models/doctor.model";
import { MONGODB_URL } from "../configs/constant";

async function fixDuplicatePhotos() {
  await mongoose.connect(MONGODB_URL);

  const doctors = await DoctorModel.find({}, { fullName: 1, photo: 1 }).lean();

  const photoMap = new Map<string, string[]>();
  for (const doc of doctors) {
    const photo = doc.photo as string | null;
    if (!photo) continue;
    const existing = photoMap.get(photo) || [];
    existing.push(doc._id.toString());
    photoMap.set(photo, existing);
  }

  const idsToNull: string[] = [];
  for (const [photo, ids] of photoMap.entries()) {
    if (ids.length > 1) {
      idsToNull.push(...ids.slice(1));
    }
  }

  if (idsToNull.length === 0) {
    console.log("No duplicate photos found. Nothing to fix.");
    await mongoose.disconnect();
    return;
  }

  const result = await DoctorModel.updateMany(
    { _id: { $in: idsToNull.map((id) => new mongoose.Types.ObjectId(id)) } },
    { $set: { photo: null } }
  );

  console.log(`Fixed ${result.modifiedCount} doctor(s) with duplicate photos — set to null (frontend will show initials).`);
  await mongoose.disconnect();
}

fixDuplicatePhotos().catch((error) => {
  console.error(error);
  process.exit(1);
});
