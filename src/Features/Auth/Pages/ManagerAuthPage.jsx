import React from "react";
import bg from "../../../assets/LoginAndSignupPageBG.png";
import ManagerLoginForm from "../Components/ManagerLoginForm";

const ManagerAuthPage = () => {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-stone-950 p-6"
      style={{
        backgroundImage: `radial-gradient(circle at center, rgba(139, 107, 67, 0.25) 0%, rgba(17, 17, 17, 0.95) 100%), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />

      <ManagerLoginForm />
    </div>
  );
};

export default ManagerAuthPage;
