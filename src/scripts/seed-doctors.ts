import mongoose from "mongoose";
import { DoctorModel } from "../models/doctor.model";
import { MONGODB_URL } from "../configs/constant";

const hospitals = [
  "Norvic International Hospital",
  "Grande International Hospital",
  "HAMS Hospital",
  "Nepal Mediciti Hospital",
  "Kathmandu Model Hospital",
  "CIWEC Hospital",
];

const specialties = [
  {
    name: "Dermatologist",
    code: "derm",
    doctors: [
      {
        fullName: "Dr. Pooja Shrestha",
        gender: "female",
        experienceYears: 12,
        consultationFee: 1200,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Sunday", "Monday", "Wednesday", "Friday"]
      },
      {
        fullName: "Dr. Anisha K.C.",
        gender: "female",
        experienceYears: 9,
        consultationFee: 1100,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[3],
        availableDays: ["Monday", "Tuesday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Nisha Thapa",
        gender: "female",
        experienceYears: 10,
        consultationFee: 1000,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Tuesday", "Wednesday", "Friday", "Sunday"]
      },
      {
        fullName: "Dr. Rina Bajracharya",
        gender: "female",
        experienceYears: 8,
        consultationFee: 950,
        rating: 4.6,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Monday", "Thursday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Sushma Paudel",
        gender: "female",
        experienceYears: 11,
        consultationFee: 1300,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[5],
        availableDays: ["Wednesday", "Thursday", "Sunday"]
      },
    ]
  },
  {
    name: "Cardiologist",
    code: "cardio",
    doctors: [
      {
        fullName: "Dr. Rajesh Maharjan",
        gender: "male",
        experienceYears: 15,
        consultationFee: 1600,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Monday", "Tuesday", "Thursday", "Friday"]
      },
      {
        fullName: "Dr. Asha Gurung",
        gender: "female",
        experienceYears: 13,
        consultationFee: 1500,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[1],
        availableDays: ["Tuesday", "Wednesday", "Friday"]
      },
      {
        fullName: "Dr. Binod Bhandari",
        gender: "male",
        experienceYears: 14,
        consultationFee: 1400,
        rating: 4.8,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Monday", "Wednesday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Sabina Karki",
        gender: "female",
        experienceYears: 10,
        consultationFee: 1350,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[3],
        availableDays: ["Tuesday", "Thursday", "Friday"]
      },
      {
        fullName: "Dr. Manish Lamsal",
        gender: "male",
        experienceYears: 11,
        consultationFee: 1450,
        rating: 4.7,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Monday", "Friday", "Sunday"]
      },
    ]
  },
  {
    name: "Neurologist",
    code: "neuro",
    doctors: [
      {
        fullName: "Dr. Suraj Sharma",
        gender: "male",
        experienceYears: 12,
        consultationFee: 1700,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[1],
        availableDays: ["Monday", "Wednesday", "Thursday"]
      },
      {
        fullName: "Dr. Pratiksha Rai",
        gender: "female",
        experienceYears: 9,
        consultationFee: 1500,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[5],
        availableDays: ["Tuesday", "Thursday", "Friday"]
      },
      {
        fullName: "Dr. Keshav Adhikari",
        gender: "male",
        experienceYears: 10,
        consultationFee: 1450,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Monday", "Tuesday", "Saturday"]
      },
      {
        fullName: "Dr. Bina Joshi",
        gender: "female",
        experienceYears: 8,
        consultationFee: 1400,
        rating: 4.6,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Wednesday", "Friday", "Sunday"]
      },
      {
        fullName: "Dr. Ramesh Tamang",
        gender: "male",
        experienceYears: 11,
        consultationFee: 1550,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Monday", "Thursday", "Saturday"]
      },
    ]
  },
  {
    name: "Orthopedic",
    code: "ortho",
    doctors: [
      {
        fullName: "Dr. Amit Basnet",
        gender: "male",
        experienceYears: 16,
        consultationFee: 1400,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Monday", "Tuesday", "Friday"]
      },
      {
        fullName: "Dr. Priya Sapkota",
        gender: "female",
        experienceYears: 10,
        consultationFee: 1300,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[3],
        availableDays: ["Wednesday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Sagar Thapa",
        gender: "male",
        experienceYears: 12,
        consultationFee: 1250,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[1],
        availableDays: ["Tuesday", "Friday", "Sunday"]
      },
      {
        fullName: "Dr. Nirmala Dahal",
        gender: "female",
        experienceYears: 9,
        consultationFee: 1200,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Monday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Deepak Pandey",
        gender: "male",
        experienceYears: 13,
        consultationFee: 1350,
        rating: 4.8,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[5],
        availableDays: ["Tuesday", "Wednesday", "Friday"]
      },
    ]
  },
  {
    name: "Pediatrician",
    code: "peds",
    doctors: [
      {
        fullName: "Dr. Smriti Poudel",
        gender: "female",
        experienceYears: 11,
        consultationFee: 1100,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Monday", "Wednesday", "Friday"]
      },
      {
        fullName: "Dr. Bishal Khadka",
        gender: "male",
        experienceYears: 8,
        consultationFee: 1000,
        rating: 4.7,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Tuesday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Anupama Shah",
        gender: "female",
        experienceYears: 10,
        consultationFee: 1050,
        rating: 4.8,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[3],
        availableDays: ["Monday", "Thursday", "Sunday"]
      },
      {
        fullName: "Dr. Nabin Shakya",
        gender: "male",
        experienceYears: 9,
        consultationFee: 980,
        rating: 4.6,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1584516150909-fe4a317162b9?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Wednesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Roshni Maharjan",
        gender: "female",
        experienceYears: 12,
        consultationFee: 1150,
        rating: 4.9,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[5],
        availableDays: ["Monday", "Tuesday", "Thursday"]
      },
    ]
  },
  {
    name: "Gynecologist",
    code: "gyno",
    doctors: [
      {
        fullName: "Dr. Sunita Rai",
        gender: "female",
        experienceYears: 14,
        consultationFee: 1300,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[1],
        availableDays: ["Monday", "Wednesday", "Friday"]
      },
      {
        fullName: "Dr. Reena K.C.",
        gender: "female",
        experienceYears: 11,
        consultationFee: 1250,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Tuesday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Alina Shrestha",
        gender: "female",
        experienceYears: 10,
        consultationFee: 1200,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1587502536575-6dfba0a6e017?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Monday", "Thursday", "Sunday"]
      },
      {
        fullName: "Dr. Sapana Regmi",
        gender: "female",
        experienceYears: 9,
        consultationFee: 1150,
        rating: 4.6,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[5],
        availableDays: ["Wednesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Meera Bista",
        gender: "female",
        experienceYears: 12,
        consultationFee: 1350,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Tuesday", "Thursday", "Sunday"]
      },
    ]
  },
  {
    name: "ENT",
    code: "ent",
    doctors: [
      {
        fullName: "Dr. Ashok Pokharel",
        gender: "male",
        experienceYears: 13,
        consultationFee: 1200,
        rating: 4.8,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[3],
        availableDays: ["Monday", "Wednesday", "Friday"]
      },
      {
        fullName: "Dr. Nisha Singh",
        gender: "female",
        experienceYears: 9,
        consultationFee: 1100,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Tuesday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Prabin Dhakal",
        gender: "male",
        experienceYears: 10,
        consultationFee: 1150,
        rating: 4.7,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1583912267670-6575ad3726f8?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[5],
        availableDays: ["Monday", "Thursday", "Sunday"]
      },
      {
        fullName: "Dr. Srijana Lama",
        gender: "female",
        experienceYears: 8,
        consultationFee: 1050,
        rating: 4.6,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[1],
        availableDays: ["Wednesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Om Poudel",
        gender: "male",
        experienceYears: 12,
        consultationFee: 1250,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1583912267675-b92419515915?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Tuesday", "Thursday", "Sunday"]
      },
    ]
  },
  {
    name: "Dentist",
    code: "dental",
    doctors: [
      {
        fullName: "Dr. Sneha Acharya",
        gender: "female",
        experienceYears: 10,
        consultationFee: 900,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Monday", "Tuesday", "Thursday"]
      },
      {
        fullName: "Dr. Riju Manandhar",
        gender: "female",
        experienceYears: 8,
        consultationFee: 850,
        rating: 4.7,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Wednesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Anmol Nepal",
        gender: "male",
        experienceYears: 9,
        consultationFee: 880,
        rating: 4.8,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Monday", "Thursday", "Sunday"]
      },
      {
        fullName: "Dr. Kanchi Pradhan",
        gender: "female",
        experienceYears: 7,
        consultationFee: 820,
        rating: 4.6,
        availability: "Available today",
        photo: "https://randomuser.me/api/portraits/women/44.jpg",
        clinic: hospitals[3],
        availableDays: ["Tuesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Arjun Tuladhar",
        gender: "male",
        experienceYears: 11,
        consultationFee: 950,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[5],
        availableDays: ["Monday", "Wednesday", "Friday"]
      },
    ]
  },
  {
    name: "Ophthalmologist",
    code: "ophth",
    doctors: [
      {
        fullName: "Dr. Dipesh KC",
        gender: "male",
        experienceYears: 12,
        consultationFee: 1100,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[1],
        availableDays: ["Monday", "Tuesday", "Thursday"]
      },
      {
        fullName: "Dr. Shekhar Rana",
        gender: "male",
        experienceYears: 10,
        consultationFee: 1050,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1645066928295-2506defde470?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[4],
        availableDays: ["Wednesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Susmita Adhikari",
        gender: "female",
        experienceYears: 9,
        consultationFee: 1000,
        rating: 4.7,
        availability: "Available today",
        photo: "https://randomuser.me/api/portraits/women/45.jpg",
        clinic: hospitals[0],
        availableDays: ["Monday", "Thursday", "Sunday"]
      },
      {
        fullName: "Dr. Sudeep Malla",
        gender: "male",
        experienceYears: 8,
        consultationFee: 980,
        rating: 4.6,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[3],
        availableDays: ["Tuesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Asmita Tamang",
        gender: "female",
        experienceYears: 11,
        consultationFee: 1100,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://randomuser.me/api/portraits/women/48.jpg",
        clinic: hospitals[5],
        availableDays: ["Monday", "Wednesday", "Friday"]
      },
    ]
  },
  {
    name: "Psychiatrist",
    code: "psych",
    doctors: [
      {
        fullName: "Dr. Sanjay Neupane",
        gender: "male",
        experienceYears: 13,
        consultationFee: 1300,
        rating: 4.9,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[2],
        availableDays: ["Monday", "Wednesday", "Friday"]
      },
      {
        fullName: "Dr. Deepshika Shakya",
        gender: "female",
        experienceYears: 10,
        consultationFee: 1250,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://randomuser.me/api/portraits/women/46.jpg",
        clinic: hospitals[5],
        availableDays: ["Tuesday", "Thursday", "Saturday"]
      },
      {
        fullName: "Dr. Bibek Rana",
        gender: "male",
        experienceYears: 9,
        consultationFee: 1200,
        rating: 4.7,
        availability: "Available today",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[0],
        availableDays: ["Monday", "Thursday", "Sunday"]
      },
      {
        fullName: "Dr. Pranita Gurung",
        gender: "female",
        experienceYears: 8,
        consultationFee: 1150,
        rating: 4.6,
        availability: "Available today",
        photo: "https://randomuser.me/api/portraits/women/47.jpg",
        clinic: hospitals[4],
        availableDays: ["Wednesday", "Friday", "Saturday"]
      },
      {
        fullName: "Dr. Utsav Lama",
        gender: "male",
        experienceYears: 11,
        consultationFee: 1350,
        rating: 4.8,
        availability: "Available tomorrow",
        photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
        clinic: hospitals[3],
        availableDays: ["Tuesday", "Thursday", "Sunday"]
      },
    ]
  },
];

async function seedDoctors() {
  await mongoose.connect(MONGODB_URL);
  await DoctorModel.deleteMany({});

  const docs = specialties.flatMap((group, groupIdx) =>
    group.doctors.map((doctor, docIdx) => ({
      doctorCode: `${group.code}-${docIdx + 1}`,
      fullName: doctor.fullName,
      gender: doctor.gender,
      specialization: group.name,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      bio: `${group.name} specialist with ${doctor.experienceYears} years of experience serving patients at ${doctor.clinic} with compassionate, evidence-based care.`,
      photo: doctor.photo,
      clinic: doctor.clinic,
      contactNumber: "+977-9800000000",
      rating: doctor.rating,
      availability: doctor.availability,
      availableDays: doctor.availableDays,
      isActive: true,
    }))
  );

  await DoctorModel.insertMany(docs);
  console.log(`Seeded ${docs.length} doctors with unique gender-matched portraits.`);
  await mongoose.disconnect();
}

seedDoctors().catch((error) => {
  console.error(error);
  process.exit(1);
});
