
export interface SchoolClass {
  id: string;
  name: string;
  classNumber: number;
  shift: string;
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
}

export interface AdmissionHold {
  holdId: string;
  classId: string;
  className: string;
  studentId: string;
  status: "HELD" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  confirmedAt?: string | null;
}
