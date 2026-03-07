import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

function PatientSignup() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try{
      await createUserWithEmailAndPassword(auth,email,password);
      alert("Account created!");
    }
    catch(error){
      alert(error.message);
    }
  };

  return(
    <div>
      <h2>Patient Signup</h2>

      <form onSubmit={handleSignup}>

        <input
          type="email"
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button>Create Account</button>

      </form>
    </div>
  )
}

export default PatientSignup;