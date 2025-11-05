"use client";

import { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const { user, signOut } = useAuthenticator();
  console.log(JSON.stringify(user, null, 2));
  return (
    <main>
      <h1>{user?.signInDetails?.loginId} Is the current Logged in user</h1>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
