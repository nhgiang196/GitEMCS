import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApiEMCSService } from 'src/app/services/api-ecms.service';
import { AuthService } from 'src/app/services/auth.service';
import { Equipments, Method, Manual, Department } from 'src/app/models/EMCSModels';
import { NgForm } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { OperationResult } from 'src/app/helpers/operationResult';
import { ToastrService } from 'ngx-toastr';
import { MyHelperService } from 'src/app/services/my-helper.service';
import { DataTableDirective } from 'angular-datatables';
import { TranslateService } from '@ngx-translate/core';

const TCode: string = 'EMCS-01' // TCode for Add or Update Equipment
@Component({
  selector: 'app-equipment-manage',
  templateUrl: './equipment-manage.component.html',
  styleUrls: ['./equipment-manage.component.css']
})
export class EquipmentManageComponent implements OnInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  @ViewChild('myInputFile')// set for emtpy file after Close or Reload
  InputManual: ElementRef;
  @ViewChild('myInputFile2')// set for emtpy file after Close or Reload
  InputMehod: ElementRef;
  constructor(
    private api: ApiEMCSService,
    private auth: AuthService,
    private toastr: ToastrService,
    public helper: MyHelperService,
    public trans: TranslateService
  ) { }

  /****************************************** DECLARATION *******************************************/
  fileUpload = { status: '', message: '', filePath: '' };
  file: File;
  plansHeader: any[];

  manual: Manual;
  equipment: Equipments
  method: Method;

  fileName: string;
  operationResult: OperationResult;
  lsEquipments: Equipments[];

  s_param: {//Search Parameter
    AssetID: string;
    EQName: string;
    Department: string;
    ProcessDepartment: string;
    UserName: string;
    Getall: boolean;
  }

  actionstatus: string

  pAssetID: string;
  pEQName: string;
  pDepartment: string;
  pProcessDepartment: string;
  pUserName: string;
  pGetall: boolean;
  lang: string = this.trans.currentLang.toString();

  //End Search Parameter
  loading = false;
  _checkAssetID: Boolean;//Use to check AssetID, = false when AssetID already exists.
  dtTrigger: Subject<any> = new Subject();

  lsDepartment: Observable<Department[]>;
  lsStandardEQ: any;

  StandardListEQ: string[];
  /******************************************Init *******************************************/
  ngOnInit() {
    this.auth.nagClass.emcsViewToogle = true;
    this.resetForm();
    this.loadDepartments();
    // this.fnSearch();
  }
  loadDepartments() {
    this.api.getBasic("Department", this.lang).subscribe((res) => {
      if (res.length >= 0) {
        this.lsDepartment = res;
      }
      else this.toastr.error("Failed load Department", "Error");
    })
    this.api.getBasic("StandardEquipments", this.lang).subscribe((res) => {
      if (res.length >= 0) {
        // this.lsDepartment = res;
        console.log("Standard Equipments:", res);
        this.lsStandardEQ = res;
      }
      else this.toastr.error("Failed load Department", "Error");
    })

  }
  private resetForm() {
    // if (form != null) ///????
    //   form.resetForm();
    this.StandardListEQ = [];
    this.equipment = {
      EQID: null, Name: '', AssetID: '', Brand: '', Model: '', UsedDate: null, Stamp: null, UserID: '', State: '', Remark: '',
      Department: this.auth.currentUser.Department,
      ProcessDepartment: '',
      AdjustType: 'I',
      Frequency: '3',
      Methods: [],
      Manuals: [],
      StandardEQs: []
    };
    this.manual = {
      FileName: '', Name: '', Version: 0, EQID: '', Stamp: null, Remark: '', MethodID: 0
    };
    this.method = {
      FileName: '', Name: '', Version: 0, EQID: '', Stamp: null, Remark: '', MethodID: null
    };
    this.pAssetID = '';
    this.pDepartment = this.auth.currentUser.Department;
    this.pEQName = '';
    this.pProcessDepartment = '';
    this.pUserName = this.auth.currentUser.Username;
    this.pGetall = false;
    this.fileName = '';
    //reset empty File
    this.InputManual.nativeElement.click();
    this.InputMehod.nativeElement.click();
  }
  handleFileInput(files: FileList) {
    this.file = files.item(0);
  }

  /******************************************Functions *******************************************/
  fnSearch() {
    this.pUserName = (this.pGetall === false ? "" : this.auth.currentUser.Username);
    this.loading = true;
    /** Refresh grid view */
    this.api.getAllEquipment(this.pAssetID
      , this.pEQName
      , this.pEQName
      , this.pDepartment || ''
      , this.pProcessDepartment || ''
      , this.pUserName
      , this.lang
    ).subscribe(res => {
      this.lsEquipments = res as Equipments[];

      // Calling the DT trigger to manually render the table
      this.loading = false;
      /** Render */
      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        // Destroy the table first
        dtInstance.destroy();
        // Call the dtTrigger to rerender again
        this.dtTrigger.next();
      });
    })
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }
  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  fnEdit(item: Equipments) {
    this.actionstatus = 'Modify'
    this._checkAssetID = true;
    this.api.getDetailEquipment(item.EQID).toPromise().then((res) => {

      this.equipment = res.Header[0];
      this.equipment.Manuals = res.Manuals;
      this.equipment.Methods = res.Methods;
    })
  }
  fnDelete(item: Equipments) {
    this.api.deleteEquipment(item).subscribe((res) => this.showMessage(res));
  }
  //Open Modal
  fnAdd() {
    this.actionstatus = 'Add';
    this.resetForm();
  }

  fnSave() {
    debugger;
    if (this.StandardListEQ)
    for (var key in this.StandardListEQ) {
        this.equipment.StandardEQs.push({
          EQID: this.equipment.EQID || '',
          StandardEQID: this.StandardListEQ[key]
        })
    }


    if (this.actionstatus == 'Add') {
      this.equipment.UserID = this.auth.currentUser.Username;
      this.api.addEquipment(this.equipment).subscribe(res => this.showMessage(res)
      )
    } else if (this.actionstatus == 'Modify') {
      this.api.updateEquipment(this.equipment).subscribe(res => this.showMessage(res)
      )
    }


  }
  private showMessage(res: any) {
    var operationResult = res as OperationResult;
    if (operationResult.Success) {
      this.toastr.success(operationResult.Message, operationResult.Caption);
    } else
      this.toastr.error(operationResult.Message, operationResult.Caption);
    this.fnSearch();
    $("#closeBtn").click();
  }
  /******************************************On change event *******************************************/
  onUploadFile(type) {
    const formData = new FormData();
    let newFileName = this.helper.getFileNameWithExtension(this.file);
    formData.append('fileName', newFileName);
    formData.append('file', this.file);
    this.api.uploadFile(formData).subscribe(res => {
      this.fileUpload = res;
    }, err => {
      this.toastr.error(err.Message, err.Caption);
    });
    //1 for Manual
    if (type === 1) {
      this.manual = {
        FileName: '',
        Name: '',
        Version: 0,
        EQID: '',
        Stamp: null,
        Remark: '',
        MethodID: 0
      }
      this.manual.Name = this.file.name;
      this.manual.FileName = newFileName;
      this.manual.Version = 1;
      this.equipment.Manuals.push(this.manual);
      this.fileName = '';
    }
    //2 for Method
    else if (type === 2) {
      this.method = {
        FileName: '',
        Name: '',
        Version: 0,
        EQID: '',
        Stamp: null,
        Remark: '',
        MethodID: 0
      }
      this.method.Name = this.file.name;
      this.method.FileName = newFileName;
      this.method.Version = 1;
      this.equipment.Methods.push(this.method);
    }
    this.file = null;

  }
  /*** Asset ID is unique */
  isExistAssetID(AssetID) {
    this._checkAssetID == true;
    this.api.checkAssetID(AssetID).subscribe(res => {
      this._checkAssetID = res > 0 ? false : true;
    })
  }
  /**Download File without RestAPI */
  onGetFile(FileName) {
    let url: string = '/engine-file/';
    url += '/' + FileName;
    window.open(url, '_blank');
  }

  /**Delete Manual Item */
  onDeleteManualFile(item) {
    this.equipment.Manuals.splice(this.equipment.Manuals.indexOf(item), 1);
  }
  /**Delete Method Item */
  onDeleteMethodFile(item) {
    this.equipment.Methods.splice(this.equipment.Methods.indexOf(item), 1);
  }

}
