import { Component, OnInit } from '@angular/core';
import { Requisition, Profile } from 'src/app/models/EMCSModels';
import { EngineService } from 'src/app/services/engine.service';
import { ToastrService } from 'ngx-toastr';
import { ApiEMCSService } from 'src/app/services/api-ecms.service';
import { AuthService } from 'src/app/services/auth.service';
import { MyHelperService } from 'src/app/services/my-helper.service';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

const NodeApiUrl = "/engine-file/";
@Component({
  selector: 'app-update-voucher',
  templateUrl: './update-voucher.component.html',
  styleUrls: ['./update-voucher.component.css']
})
export class UpdateVoucherComponent implements OnInit {

  constructor(
    public engineApi: EngineService,
    private toastr: ToastrService,
    private api: ApiEMCSService,
    private auth: AuthService,
    public helper: MyHelperService,
    private route: ActivatedRoute,
    private trans: TranslateService
  ) { }


  list: { Departments: any, Equipments: any[], Data?: any }; //lists return after Get Data
  /**init */
  operationResult: any;
  Profile: Profile; // Use to add to Requisition.Profiles
  actionstatus: string
  //Upload File
  fileName: string;
  file: File;
  fileUpload = { status: '', message: '', filePath: '' };
  error: string;
  //End uploadfile
  choosenEntity: Requisition; // choose parrams on edit modal page
  plansHeader: any[] = []; // header columns
  alertoptions: any = {};
  loading = false;
  Status = ''; //N: New, M: Modify, X: Delete
  searchParams: { Department: string, Type: string, Year: string, Status: string }; //search params
  CheckMonth: string;
  CheckDate: number;
  isValid: boolean = true;
  lsVoucher: Requisition[];
  userChecklist: any;
  flowKey: string;
  disableButton: boolean;
  lang: string = this.trans.currentLang.toString()


  /************************************Init ****************************************************/
  ngOnInit() {
    this.auth.nagClass.emcsViewToogle = true; //nag-toogle
    this.loading = false;
    this.choosenEntity = {
      VoucherID: null, EQID: null, State: null, Remark: '', YearAdjust: null, MonthAdjust: null, Profiles: [],
      UserID: this.auth.currentUser.Username,
      CreateTime: ''
    } // choosed params on edit modal page
    this.Profile = {
      VoucherID: '', FileResult: '', Name: '', EQID: '', Temparature: '', Humidity: '', Passed: false, UploadBy: '', Stamp: null, Remark: '', State: '',
    } //??
    this.fileName = '';
    this.searchParams = { Department: this.auth.currentUser.Department, Type: '', Year: '', Status: '' }; //search params
    this.route.params.subscribe(params => {
      this.fnShowEdit(params['businessKey']);
    });
   
    this.lsVoucher = null
    this.list = { Departments: [], Equipments: [] };//lists return after Get Data
    this.getBasic();
    $('#fileupload').val('');
    this.flowKey = "EMCSWorkFlow";
    this.userChecklist = "LeaderCheckList";
    this.disableButton = true;


  }

  private getBasic() {
    this.api.getBasic("Department", this.lang).subscribe((res) => {
      if (res.length >= 0) {
        this.list.Departments = res;
      }
      else this.toastr.error("Failed load Department", "Error");
    })
    this.api.getBasic("Equipment", this.auth.currentUser.Department).subscribe((res) => {
      if (res.length >= 0) {
        this.list.Equipments = [];
        res.forEach(element => {
          if (element.Department == this.auth.currentUser.Department || this.auth.isLabUser())
            this.list.Equipments.push(element);
        });
      }
      else {
        this.toastr.error("Failed load Equipments", "Error");

      }
    })
    if (this.list.Departments == null || this.list.Equipments == null)
      this.loading = false;
  }

  /***********************************Functions ***********************************/
  handleFileInput(files: FileList) {
    this.file = files.item(0);
  }
  checkVoucherNeedSubmit(DateAdjust) {
    var today = new Date();
    this.CheckMonth = String(today.getMonth() + 1) + "/" + today.getFullYear(); //January is 0!
    this.CheckDate = (Number)(String(today.getDate()));
    return (DateAdjust == this.CheckMonth && this.CheckDate > 5) ? true : false
  }


  addDetail() {
    const formData = new FormData();
    this.fileName = this.helper.getFileNameWithExtension(this.file);
    formData.append('fileName', this.fileName);
    formData.append('file', this.file);
    this.api.uploadFile(formData).subscribe
      (res => this.fileUpload = res, err => this.error = err);
    this.Profile.Name = this.file.name;
    this.Profile.FileResult = this.fileName;

    this.choosenEntity.Profiles.push(this.Profile);
    this.fileName = '';
    this.Profile = {
      VoucherID: '',
      FileResult: '',
      Name: '',
      EQID: '',
      Temparature: '',
      Humidity: '',
      Passed: null,
      UploadBy: '',
      Stamp: null,
      Remark: '',
      State: '',
    }
    $('#fileupload').val('');
    this.file = null;

  }
  onDeleteProfiles(item) {
    this.choosenEntity.Profiles.splice(this.choosenEntity.Profiles.indexOf(item), 1);
  }
  //Download File
  onGetFile(FileName) {
    let url: string = NodeApiUrl;
    url += '/' + FileName;
    window.open(url, '_blank');
  }

  fnSave() {
    switch (this.Status) {
      case 'N': //VOUCHER REQUISTION
        this.choosenEntity.State = 'N';
        this.api.addVoucher(this.choosenEntity).subscribe((res) => {
          this.operationResult = res
          if (this.operationResult.Success) {
            this.toastr.success(this.operationResult.Message, this.operationResult.Caption);
            $('#btnClose').click();
          }
          else
            this.toastr.error(this.operationResult.Message, this.operationResult.Caption);
        })
        break;

      case 'M': // UPDATE VOUCHER REQUISTION
        this.choosenEntity.State = 'M';
        this.api.updateVoucher(this.choosenEntity).subscribe((res) => {
          this.operationResult = res
          if (this.operationResult.Success) {
            this.toastr.success(this.operationResult.Message, this.operationResult.Caption);
            // this line: modal down
          }
          else
            this.toastr.error(this.operationResult.Message, this.operationResult.Caption);
        })
        break;

      case 'X':
        /**Delete */
        break;
    }

  }
  fnSubmit() {
    let camundaForm = {
      "variables":
        { "LeaderCheckList": { "value": this.engineApi.lsCheckers } },
      "businessKey": this.choosenEntity.VoucherID
    }
    switch (this.Status) {
      case 'N': //VOUCHER REQUISTION
        this.choosenEntity.State = 'S';
        this.api.addVoucher(this.choosenEntity).subscribe((res) => {
          this.operationResult = res
          if (this.operationResult.Success) {
            this.engineApi.processDefinitionStart(this.flowKey, camundaForm).subscribe(res => {
              if (res != null) {
                this.toastr.success('Submit Sucess!', 'Your voucher already submitted\n Thank you!');
              }
              else {
                this.toastr.error('Error!', 'Your task did not submit\n Please try again!');
              }
            })
            this.toastr.success(this.operationResult.Message, this.operationResult.Caption);
            $('#closeBtn').click();
          }
          else
            this.toastr.error(this.operationResult.Message, this.operationResult.Caption);
        })
        break;

      case 'M': // UPDATE VOUCHER REQUISTION
        this.choosenEntity.State = 'S';
        this.api.updateVoucher(this.choosenEntity).subscribe((res) => {
          this.operationResult = res
          if (this.operationResult.Success) {
            this.toastr.success(this.operationResult.Message, this.operationResult.Caption);
            // this line: modal down
            this.engineApi.processDefinitionStart(this.flowKey, camundaForm).subscribe(res => {
              if (res != null) {
                this.toastr.success('Submit Sucess!', 'Your voucher already submitted\n Thank you!');
              }
              else {
                this.toastr.error('Error!', 'Your task did not submit\n Please try again!');
              }
            })
          }
          else
            this.toastr.error(this.operationResult.Message, this.operationResult.Caption);
        })
        break;
    }
  }

  fnShowEdit(VoucherID) { //open modal
    this.Status = 'M';
    console.log(this.choosenEntity);
    this.api.findVoucher(VoucherID).subscribe((res) => {
      this.choosenEntity = res.Header[0];
      this.choosenEntity.Profiles = res.Detail;
      console.log(this.choosenEntity);
    })
    this.DisableButton();
  }
  fnAdd() {
    this.Status = 'N',
      this.choosenEntity.EQID = '';
    this.choosenEntity.VoucherID = '';
    this.choosenEntity.Remark = '';
    this.choosenEntity.Profiles = [];
    $('.modal-title').text('Add Voucher');
  }

  DisableButton() {
    if ((this.choosenEntity.State == 'P' || this.choosenEntity.State == 'S') && this.Status != 'N') {
      this.disableButton = true;
    } else {
      this.disableButton = false;
    }
  }
}