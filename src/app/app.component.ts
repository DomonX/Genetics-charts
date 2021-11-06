import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ReportService } from './report-service.service';

import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ChartData, ChartDataset } from 'chart.js';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  destroyed: Subject<void> = new Subject<void>();

  public data$: Observable<ChartData>;
  public count$: Observable<number>;

  public currentPage$: Subject<number> = new BehaviorSubject<number>(0);

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private service: ReportService
  ) {}

  public ngOnInit(): void {
    this.data$ = this.currentPage$.pipe(
      switchMap((i) =>
        this.service.getReportForChart(i, {
          start: 0,
          end: Infinity,
        })
      ),
      map((i) => this.service.toChartJs(i)),
      takeUntil(this.destroyed)
    );

    this.count$ = this.service.count();
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
  }
}
