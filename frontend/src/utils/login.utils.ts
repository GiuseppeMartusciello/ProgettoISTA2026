import { User } from "../types/user.interface";
import { toast } from "react-toastify";


export function showLoginSuccessToast(user: User) {
  if (user.gender === "Uomo") toast.success(`Benvenuto ${user.name} :)`);
  else if (user.gender === "Donna") toast.success(`Benvenuta ${user.name} :)`);
  else toast.success(`Benvenutx ${user.name} :)`);
}