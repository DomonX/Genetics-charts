import { Component } from "@angular/core";
import { ElectronService } from "./core/services";
import { TranslateService } from "@ngx-translate/core";
import { APP_CONFIG } from "../environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  data: any;

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang("en");
    console.log("APP_CONFIG", APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log("Run in electron");
      console.log("Electron ipcRenderer", this.electronService.ipcRenderer);
      console.log("NodeJS childProcess", this.electronService.childProcess);
    } else {
      console.log("Run in browser");
    }

    this.data = {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
        {
          label: "First Dataset",
          data: [65, 59, 80, 81, 56, 55, 40],
        },
        {
          label: "Second Dataset",
          data: [28, 48, 40, 19, 86, 27, 90],
        },
      ],
    };
  }
}
