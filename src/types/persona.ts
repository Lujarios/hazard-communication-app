export type PersonaRecord = {
  id: string;
  name: string;
  roleDescription: string;
  evaluationInstructions: string;
  initials: string;
  avatarColor: string;
  imagePath: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};
