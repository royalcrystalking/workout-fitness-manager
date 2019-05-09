import { Injectable } from '@angular/core';

import { Observable, BehaviorSubject } from 'rxjs';
import { pluck, distinctUntilChanged } from 'rxjs/operators';

import { User } from '@app/auth/shared/services/auth.service';
import { Meal } from '@app/health/shared/services/meals.service';


export interface State {
  user: User;
  meals: Meal[];
  [key: string]: any;
}

const state: State = {
  user: undefined,
  meals: undefined
};

@Injectable({ providedIn: 'root' })
export class Store {

  private subject = new BehaviorSubject<State>(state);
  private store = this.subject.asObservable().pipe(distinctUntilChanged());

  get value() {
    return this.subject.value;
  }

  select<T>(name: string): Observable<T> {
    return this.store.pipe(pluck(name));
  }

  set(name: string, state: any) {
    this.subject.next({ ...this.value, [name]: state });
  }

}
