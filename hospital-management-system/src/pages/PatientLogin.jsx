import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";



function PatientLogin(){
  const provider = new GoogleAuthProvider();

const googleLogin = async () => {
  try{
    await signInWithPopup(auth,provider);
    alert("Google Login Successful");
  }
  catch(error){
    alert(error.message);
  }
}
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleLogin = async(e)=>{
    e.preventDefault();

    try{
      await signInWithEmailAndPassword(auth,email,password);
      alert("Login successful");
    }
    catch(error){
      alert(error.message);
    }
  }

  return(

    <div>
      <h2>Patient Login</h2>

      <form onSubmit={handleLogin}>

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

        <button>Login</button>
        <button onClick={googleLogin}>
Continue with Google
</button>

      </form>

    </div>

  )
}

export default PatientLogin;