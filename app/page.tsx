import Image from "next/image";
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login'); // Redirects to the /login page
}
