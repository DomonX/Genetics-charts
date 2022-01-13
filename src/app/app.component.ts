import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IReport, ReportService } from './report-service.service';

import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ChartData } from 'chart.js';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';

import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public data$: Observable<ChartData>;
  public count$: Observable<number>;
  public currentPage$: Subject<number> = new BehaviorSubject<number>(0);
  public reports: Observable<IReport[]>;
  public isLoading$: Observable<boolean>;
  
  private selectControl: FormControl;
  private destroyed: Subject<void> = new Subject<void>();

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private service: ReportService
  ) {}

  public ngOnInit(): void {
    this.selectControl = new FormControl('');
    this.selectControl.valueChanges.pipe(takeUntil(this.destroyed)).subscribe(i => this.service.setReport(i.name))
    this.currentPage$.pipe(takeUntil(this.destroyed)).subscribe(i => this.service.setConfig({ env: i }))
    this.data$ = this.service.getReportForChart().pipe(
      map((i) => this.service.toChartJs(i)),
      takeUntil(this.destroyed)
    );
    this.isLoading$ = this.service.isLoading;

    this.count$ = this.service.count();
    this.reports = this.service.reports;
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
  }

  public onChanged(event: any): void {
    console.log(event);
  }
}
