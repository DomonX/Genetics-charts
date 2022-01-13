import { ElectronService } from './core/services/electron/electron.service';
import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
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
  volume: number;
}

export interface IReport {
  url: string;
  name: string;
}

export type EnvReports = Env[];
export type Report = EnvReports[] & { compatibilityPower: number; mutationChance: number; vegetationsPerEnvironment: number; mutationMode: boolean };

export type RawEnvReport = string[];
export type RawReport = RawEnvReport[];

export type DataSetConf = {
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
  borderDash?: [number, number];
};

export const datasetConfigs: { [P in keyof Env]: DataSetConf } = {
  environmentRed: { borderColor: '#ff0000', backgroundColor: '#ff0000' },
  environmentGreen: { borderColor: '#00ff00', backgroundColor: '#00ff00' },
  environmentBlue: { borderColor: '#0000ff', backgroundColor: '#0000ff' },
  avarageRed: { borderColor: '#ff0000', backgroundColor: '#ff0000', borderDash: [5, 5] },
  avarageGreen: { borderColor: '#00ff00', backgroundColor: '#00ff00', borderDash: [5, 5] },
  avarageBlue: { borderColor: '#0000ff', backgroundColor: '#0000ff', borderDash: [5, 5] },
  avarageCombatibility: { borderColor: 'rgba(255,255,0,1)', backgroundColor: 'rgba(255,255,0,0.2)', fill: true },
  volume: { borderColor: '#000000', backgroundColor: '#000000' }
};

export type ChartReport = Record<keyof Env, number[]>;

@Injectable({
  providedIn: 'root',
})
export class ReportService {

  public reportsRootUrl: string = 'src/assets/reports';
  public reports: ReplaySubject<IReport[]> = new ReplaySubject<IReport[]>();
  public isLoading: ReplaySubject<boolean> = new ReplaySubject<boolean>();


  private config: ReplaySubject<any> = new ReplaySubject<any>();
  private data: ReplaySubject<RawReport> = new ReplaySubject<RawReport>();
  private metaData: ReplaySubject<RawReport> = new ReplaySubject<RawReport>();
  private parsedReports: Record<string, RawReport> = {};
  private _reports: IReport[];
  private _config: any = { start: 0, end: Infinity, env: 0, round: 200};

  constructor(private electron: ElectronService, private http: HttpClient) {
    this.getReportList();   
    this.setReport(this._reports[0].name);
  }

  public setConfig(config: any): void {
    this._config = {...this._config, ...config};
    this.config.next(this._config);
  }

  public getReport(): Observable<EnvReports> {
    return combineLatest([this.data, this.config]).pipe(
      tap(console.log),
      map(([data, config]) => data[config.env]
        .slice(config.start, config.end)
       
        .filter((i, index, array) => index % Math.round(array.length / config.round) === 0)
        .map(i => this.mapEnv(i)))
    )
    
  }

  public setReport(name: string): void {
    this.isLoading.next(true);
    if(!this._reports.map(i => i.name).some(i => i === name)) {
      return;
    }

    if(!this.parsedReports[name]) {
      this.parsedReports[name] = this.loadReport(name);
    }

    this.data.next(this.parsedReports[name].slice(0, -4));
    this.metaData.next(this.parsedReports[name].slice(4));
    this.isLoading.next(false);
  }

  public count(): Observable<number> {
    return this.data.pipe(map((i) => i.length));
  }

  public getReportForChart(): Observable<ChartReport> {
    return this.getReport().pipe(
      tap(console.log),
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


  public toChartJs(report: ChartReport): ChartData {
    console.log(report);
    const indexes = report.avarageCombatibility.map((i, index) =>
      index.toString()
    );
    return {
      datasets: (Object.keys(report) as (keyof ChartReport)[])
        .sort((a, b) => (a === 'avarageCombatibility' ? 0 : -1))
        .map((i: keyof ChartReport) => ({
          data: report[i],
          label: i,
          ...datasetConfigs[i],
        })),
      labels: indexes,
    };
  }

  private mapEnv(val: string): Env {
    const [r, g, b, comp, avgRed, avgGreen, avgBlue, volume] = val
      .split('.')
      .map((i) => i.replace(',', '.'))
      .map((i) => Number.parseFloat(i));
    return {
      environmentRed: r,
      environmentGreen: g,
      environmentBlue: b,
      avarageCombatibility: comp,
      avarageRed: avgRed,
      avarageGreen: avgGreen,
      avarageBlue: avgBlue,
      volume
    };
  }

  private getReportList(): void {
    this._reports = this.electron.fs.readdirSync(this.reportsRootUrl).map(i =>({ url: `${this.reportsRootUrl}/${i}`, name: i}));
    this.reports.next(this._reports);
  }

  private loadReport(name: string): RawReport {
    return this.electron.fs.readFileSync(this._reports.find(i => i.name === name).url, { encoding: 'utf8'}).split('\n')
      .map((j) => j.split(';'))
      .reduce((acc, curr) => {
        curr.forEach(
          (j, index) => (acc[index] = [...(acc[index] ?? []), j])
        );
        return acc;
      }, [] as RawReport)
      .slice(0, -1);

    
  }
}
