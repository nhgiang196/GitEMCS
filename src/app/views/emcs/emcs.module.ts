import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentManageComponent } from './equipment-manage/equipment-manage.component';
import { PlanScheduleComponent } from './plan-schedule/plan-schedule.component';
import { VoucherRequisitionComponent } from './voucher-requisition/voucher-requisition.component';

import { VoucherRequisitionDetailComponent } from './voucher-requisition-detail/voucher-requisition-detail.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AdminModule } from 'src/app/components/common/admin/admin.module';
import { EquipmentDetailComponent } from './equipment-detail/equipment-detail.component';
import { UpdateVoucherComponent } from './update-voucher/update-voucher.component';
@NgModule({
  declarations: [EquipmentManageComponent, 
    PlanScheduleComponent, 
    VoucherRequisitionComponent, 
    VoucherRequisitionDetailComponent,
    EquipmentDetailComponent,
    UpdateVoucherComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    AdminModule
  ],
  exports:[EquipmentManageComponent,PlanScheduleComponent,VoucherRequisitionComponent,EquipmentDetailComponent]
})
export class EMCSModule { }
