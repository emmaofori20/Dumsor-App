import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly enabled = !environment.firebaseConfig.apiKey.startsWith('YOUR_');
  readonly app?: FirebaseApp;
  readonly db?: Firestore;
  readonly auth?: Auth;

  constructor() {
    if (!this.enabled) return;

    this.app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    void signInAnonymously(this.auth).catch(() => undefined);
  }
}
