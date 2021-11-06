import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ReportService } from './report-service.service';

import { map, takeUntil, tap } from 'rxjs/operators';
import { ChartData, ChartDataset } from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  destroyed: Subject<void> = new Subject<void>();

  data: any;

  basicData: ChartData;

  constructor(private service: ReportService) {}

  public ngOnInit(): void {
    const data$ = this.service.getReportForChart(1, { start: 0, end: Infinity });

    data$
      .pipe(
        map((i) => this.service.toChartJs(i)),
        takeUntil(this.destroyed)
      )
      .subscribe((i) => (this.basicData = i));
  }

  public ngOnDestroy(): void {
    this.destroyed.next();
  }
}
