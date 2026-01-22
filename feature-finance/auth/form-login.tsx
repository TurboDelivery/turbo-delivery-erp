'use client';

import { Lock, User } from 'lucide-react';
export function FormLogin() {
  

  return (
    <>
      <form className=" -y-5 dark:text-white">
        <div>
          <label htmlFor="username">Nom d&apos;utilisateur</label>
          <div className="relative">
            <input id="username" name="username" type="text" required placeholder="Username" className="form-input ps-10" />
            <span className="absolute start-4 top-1/2 -translate-y-1/2">
              <User />
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="Password">Password</label>
          <div className="relative text-black">
            <input id="Password" name="password" type="password" required placeholder="Enter Password" className="form-input ps-10 placeholder:text-gray-500" />
            <span className="absolute start-4 top-1/2 -translate-y-1/2">
              <Lock />
            </span>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Je me connecte</button>
      </form>
    </>
  );
}
