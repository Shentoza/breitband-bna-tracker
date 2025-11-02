import { readConfig } from './config.js';
import { ParsedResult } from './csv.js';

export type ISPDetails = {
    providerName?: string;
    postcode?: string;
    planName?: string;
    download: SpeedDetails;
    upload: SpeedDetails;
}

export type SpeedDetails = {
    max: number;
    avg: number;
    min: number;
}

export type RatedResult = {
    rawResult: ParsedResult;
    DownloadStatus: ContractCheckStatus;
    UploadStatus: ContractCheckStatus;
    isViolated: boolean;
}

export enum ContractCheckStatus {
    OK = 0,
    BelowAverage = 1,
    BelowMinimum = 2,
}

export function rateValue(value: number, speedDetails: SpeedDetails): ContractCheckStatus {
    if (value >= speedDetails.avg) {
        return ContractCheckStatus.OK;
    } else if (value >= speedDetails.min) {
        return ContractCheckStatus.BelowAverage;
    } else {
        return ContractCheckStatus.BelowMinimum;
    }
}

export function rateResult(result: ParsedResult, ispDetails: ISPDetails): RatedResult {
    const downloadStatus = rateValue(result["Download (Mbit/s)"], ispDetails.download);
    const uploadStatus = rateValue(result["Upload (Mbit/s)"], ispDetails.upload);
    return {
        rawResult: result,
        DownloadStatus: downloadStatus,
        UploadStatus: uploadStatus,
        isViolated: downloadStatus !== ContractCheckStatus.OK || uploadStatus !== ContractCheckStatus.OK
    };
}