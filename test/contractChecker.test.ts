import { describe, it, expect } from "vitest";
import {
  rateValue,
  ContractCheckStatus,
  ISPDetails,
  rateResult,
} from "../src/contractChecker";

describe("rateValue", () => {
  const details = { max: 100, avg: 60, min: 30 };

  it("returns OK when value >= avg", () => {
    expect(rateValue(60, details)).toBe(ContractCheckStatus.OK);
    expect(rateValue(80, details)).toBe(ContractCheckStatus.OK);
  });

  it("returns BelowAverage when value < avg but >= min", () => {
    expect(rateValue(59.9, details)).toBe(ContractCheckStatus.BelowAverage);
    expect(rateValue(30, details)).toBe(ContractCheckStatus.BelowAverage);
  });

  it("returns BelowMinimum when value < min", () => {
    expect(rateValue(29.9, details)).toBe(ContractCheckStatus.BelowMinimum);
    expect(rateValue(0, details)).toBe(ContractCheckStatus.BelowMinimum);
  });

  it("handles NaN values as BelowMinimum", () => {
    expect(rateValue(Number.NaN, details)).toBe(
      ContractCheckStatus.BelowMinimum
    );
  });
});

describe("rateResult", () => {
  const details: ISPDetails = {
    providerName: "Test ISP",
    postcode: "12345",
    planName: "Test Plan",
    download: { max: 10, avg: 5, min: 2 },
    upload: { max: 10, avg: 5, min: 2 },
  };


    const makeParsed = (d: number, u: number) => ({
      'Download (Mbit/s)': d,
      'Upload (Mbit/s)': u,
    } as any);

    const cases: Array<[number, number, ContractCheckStatus, ContractCheckStatus]> = [
      [6, 6, ContractCheckStatus.OK, ContractCheckStatus.OK],
      [4, 6, ContractCheckStatus.BelowAverage, ContractCheckStatus.OK],
      [1, 0, ContractCheckStatus.BelowMinimum, ContractCheckStatus.BelowMinimum],
      [6, 0, ContractCheckStatus.OK, ContractCheckStatus.BelowMinimum],
      [0, 6, ContractCheckStatus.BelowMinimum, ContractCheckStatus.OK],
    ];

    cases.forEach(([d, u, expectedD, expectedU]) => {
      it(`rates download=${d} upload=${u} -> download=${ContractCheckStatus[expectedD]} upload=${ContractCheckStatus[expectedU]}`, () => {
        const parsed = makeParsed(d, u);
        const out = rateResult(parsed, details);
        expect(out.DownloadStatus).toBe(expectedD);
        expect(out.UploadStatus).toBe(expectedU);
      });
    });
});
