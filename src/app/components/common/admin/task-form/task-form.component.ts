import { Component, OnInit, Inject, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MyTaskInjector } from 'src/app/helpers/MyTaskInjector';

import { Task } from 'src/app/models/camunda';
import { VoucherDetailComponent } from 'src/app/views/emcs/voucher-detail/voucher-detai.component';
import { EngineService } from 'src/app/services/engine.service';
import { TaskCompleteComponent } from '../task-complete/task-complete.component';
import { UpdateVoucherComponent } from 'src/app/views/emcs/update-voucher/update-voucher.component';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit {
  taskCurrent: Task;
  myDecisionList: any[] = []
  approveComponent: any;
  bonusComponent: any;
  myInjector: Injector;
  checkCondition: String;
  flowKey: string;
  constructor(private injector: Injector, private route: ActivatedRoute, private router: Router, public engineApi: EngineService) { }

  ngOnInit() {
    this.engineApi.hiddenApprove = true;// invisible Component Approval
    this.route.params.subscribe((res) => {
      this.engineApi.currentTask = this.taskCurrent = res as Task;
      this.myInjector = Injector.create({ providers: [{ provide: MyTaskInjector, useValue: this.taskCurrent }, { provide: MyTaskInjector, useValue: this.myDecisionList }], parent: this.injector });

    })
    this.loadComponent();
  }
  loadComponent() {
    switch (this.taskCurrent.formKey) {
      case 'VoucherRequisitionComponent':
        this.approveComponent = VoucherDetailComponent; // detailComponent
        // this.bonusComponent = TaskCompleteComponent; //This is bonus Component
        this.checkCondition = "IsPublish";//condition Completed
        this.engineApi.decisionList = [{ name: 'Agree', value: 'Yes' }, { name: 'Disagree', value: 'No' }]; //List conditions in dropdownlist
        this.flowKey = "EMCSWorkFlow"
        break;
      case 'UploadResultComponent':
        this.approveComponent = UpdateVoucherComponent; // detailComponent
        this.checkCondition = "IsPublish";//condition Completed
        this.engineApi.decisionList = [{ name: 'Agree', value: 'Yes' }]; //List conditions in dropdownlist
        this.flowKey = "EMCSWorkFlow"
        break;
      default:
        break;
    }
  }

}
