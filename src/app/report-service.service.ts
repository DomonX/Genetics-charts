import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ChartData } from 'chart.js';

export interface Env {
  environmentRed: number;
  environmentGreen: number;
  environmentBlue: number;
  avarageCombatibility: number;
  avarageRed: number;
  avarageGreen: number;
  avarageBlue: number;
}

export type EnvReports = Env[];
export type Report = EnvReports[];

export type RawEnvReport = string[];
export type RawReport = RawEnvReport[];

export type DataSetConf = {
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
  borderDash?: [number, number],
};

export const datasetConfigs: { [P in keyof Env]: DataSetConf } = {
  environmentRed: { borderColor: '#ff0000', backgroundColor: '#ff0000' },
  environmentGreen: { borderColor: '#00ff00', backgroundColor: '#00ff00' },
  environmentBlue: { borderColor: '#0000ff', backgroundColor: '#0000ff' },
  avarageRed: { borderColor: '#ff0000', backgroundColor: '#ff0000', borderDash: [5, 5] },
  avarageGreen: { borderColor: '#00ff00', backgroundColor: '#00ff00', borderDash: [5, 5] },
  avarageBlue: { borderColor: '#0000ff', backgroundColor: '#0000ff', borderDash: [5, 5] },
  avarageCombatibility: {
    borderColor: 'rgba(255,255,0,1)',
    backgroundColor: 'rgba(255,255,0,0.2)',
    fill: true,
  },
};

export type ChartReport = Record<keyof Env, number[]>;

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private data: ReplaySubject<RawReport> = new ReplaySubject<RawReport>();

  constructor(private http: HttpClient) {
    this.getReports().subscribe((i: RawReport) => {
      this.data.next(i)
    });
  }

  public getReport(
    env: number,
    page: { start: number; end: number }
  ): Observable<EnvReports> {
    const { start, end } = page;
    return this.data.pipe(
      map((i) => i[env]),
      map((i) => i.slice(start, end)),
      map((i) =>
        i.filter(
          (i, index, array) => index % Math.round(array.length / 10) === 0
        )
      ),
      map((i) => i.map((j) => this.mapEnv(j)))
    );
  }

  public count(): Observable<number> {
    return this.data.pipe(map(i => i.length));
  }

  public getReportForChart(
    env: number,
    page: { start: number; end: number }
  ): Observable<ChartReport> {
    return this.getReport(env, page).pipe(
      map((i) =>
        i.reduce((acc, curr) => {
          Object.keys(curr).forEach(
            (key) => (acc[key] = [...(acc[key] ?? []), curr[key]])
          );
          return acc;
        }, {} as ChartReport)
      )
    );
  }

  public toNgxChart(
    report: ChartReport
  ): { name: string; series: { name: string; value: number }[] }[] {
    return Object.keys(report).map((key) => {
      return {
        name: key,
        series: report[key].map((i, index) => ({
          name: `${index}`,
          value: Number.isNaN(i) ? 0 : i ?? 0,
        })),
      };
    });
  }

  public toChartJs(report: ChartReport): ChartData {
    const indexes = report.avarageCombatibility.map((i, index) => index.toString());
    return {
      datasets: Object.keys(report)
        .sort((a, b) => (a === 'comp' ? 0 : -1))
        .map((i: keyof ChartReport) => ({
          data: report[i],
          label: i,
          ...datasetConfigs[i],
        })),
      labels: indexes,
    };
  }

  private mapEnv(val: string): Env {
    const [r, g, b, comp, avgRed, avgGreen, avgBlue] = val
      .split('.')
      .map((i) => i.replace(',', '.'))
      .map((i) => Number.parseFloat(i));
    return { environmentRed: r, environmentGreen: g, environmentBlue: b, avarageCombatibility: comp, avarageRed: avgRed, avarageGreen: avgGreen, avarageBlue: avgBlue };
  }

  private getReports(): Observable<RawReport> {
    return this.http.get('assets/report.csv', { responseType: 'text' }).pipe(
      map((i) =>
        i
          .split('\n')
          .map((j) => j.split(';'))
          .reduce((acc, curr) => {
            curr.forEach(
              (i, index) => (acc[index] = [...(acc[index] ?? []), i])
            );
            return acc;
          }, [] as RawReport).slice(0, -1)
      ),
      tap(console.log)
    );
  }
}