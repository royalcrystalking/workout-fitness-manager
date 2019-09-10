import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';

import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { tap, map, switchMap } from 'rxjs/operators';

import { Store } from '@app/store';

import { Meal } from '@app/health/shared/services/meals.service';
import { Workout } from '@app/health/shared/services/workouts.service';
import { AuthService } from '@app/auth/shared/services/auth.service';


export interface ScheduleItem {
  meals: Meal[];
  workouts: Workout[];
  section: string;
  timestamp: number;
  key?: string;
}

export interface ScheduleList {
  morning?: ScheduleItem;
  lunch?: ScheduleItem;
  evening?: ScheduleItem;
  snacks?: ScheduleItem;
  [key: string]: any;
}

@Injectable()
export class ScheduleService {

  private date$ = new BehaviorSubject(new Date());
  private section$ = new Subject();

  selected$ = this.section$
    .pipe(tap((next: any) => this.store.set('selected', next)));

  list$ = this.section$
    .pipe(
      map((value: any) => this.store.value[value.type]),
      tap((next: any) => this.store.set('list', next))
    );

  schedule$: Observable<ScheduleItem[]> = this.date$
    .pipe(
      tap((next: any) => this.store.set('date', next)),
      map((day: any) => {
        const startAt = (
          new Date(day.getFullYear(), day.getMonth(), day.getDate())
        ).getTime();

        const endAt = (
          new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
        ).getTime() - 1;

        return { startAt, endAt };
      }),
      switchMap(({ startAt, endAt }: any) => this.getSchedule(startAt, endAt)
        .pipe(map((data: any) => {
          const mapped: ScheduleList = {};

          for (const prop of data) {
            if (!mapped[prop.section]) {
              mapped[prop.section] = prop;
            }
          }

          return mapped;

      }))
    ),
    tap((next: any) => this.store.set('schedule', next))
  );

  constructor(
    private store: Store,
    private authService: AuthService,
    private db: AngularFireDatabase
  ) {}

  get uid() {
    return this.authService.user.uid;
  }

  updateDate(date: Date) {
    this.date$.next(date);
  }

  selectSection(event: any) {
    this.section$.next(event);
  }

  getSchedule(startAt: number, endAt: number) {
    return this.db
      .list(`schedule/${this.uid}`, ref => ref.orderByChild('timestamp').startAt(startAt).endAt(endAt))
      .snapshotChanges()
      .pipe(map(changes => changes.map(c => ({ key: c.payload.key, ...c.payload.val() }))));
  }


}
