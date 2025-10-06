import { readConfig } from './config.js';

function safeNumber(v) {
  if (v === undefined || v === null) return NaN;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function pct(numerator, denom) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denom) || denom === 0) return NaN;
  return (numerator / denom) * 100;
}

export async function evaluateContract(result, cfg = null) {
  if (!result) return null;

  let config = cfg;
  if (!config) {
    config = await readConfig();
  }

  const contract = config?.contract ?? null;
  const check = {
    enabled: !!contract,
    contract: contract || null,
    measured: {
      downloadMbit: safeNumber(result['Download (Mbit/s)']),
      uploadMbit: safeNumber(result['Upload (Mbit/s)']),
      pingMs: safeNumber(result['Laufzeit (ms)']),
    },
    computed: {},
    violations: {
      download: null,
      upload: null,
      ping: null,
    },
    isViolation: false,
    reasons: [],
  };

  if (!contract) {
    check.reasons.push('No contract configured (contract section missing in config).');
    return { ...result, contractCheck: check };
  }

  const advDown = safeNumber(contract.advertisedDownloadMbit);
  const guarDown = safeNumber(contract.guaranteedDownloadMbit);
  const advUp = safeNumber(contract.advertisedUploadMbit);
  const guarUp = safeNumber(contract.guaranteedUploadMbit);

  const md = check.measured.downloadMbit;
  const mu = check.measured.uploadMbit;
  const mp = check.measured.pingMs;

  // computed percentages
  check.computed.downloadPercentOfGuaranteed = Number.isFinite(guarDown) && guarDown > 0 ? pct(md, guarDown) : NaN;
  check.computed.downloadPercentOfAdvertised = Number.isFinite(advDown) && advDown > 0 ? pct(md, advDown) : NaN;
  check.computed.uploadPercentOfGuaranteed = Number.isFinite(guarUp) && guarUp > 0 ? pct(mu, guarUp) : NaN;
  check.computed.uploadPercentOfAdvertised = Number.isFinite(advUp) && advUp > 0 ? pct(mu, advUp) : NaN;

  // download violation logic
  const download = {
    measured: md,
    guaranteed: Number.isFinite(guarDown) ? guarDown : null,
    advertised: Number.isFinite(advDown) ? advDown : null,
    belowGuaranteed: false,
  };
  if (Number.isFinite(guarDown) && guarDown > 0) {
    download.belowGuaranteed = Number.isFinite(md) ? md < guarDown : false;
    if (download.belowGuaranteed) {
      check.isViolation = true;
      check.reasons.push(`Download ${md} Mbit/s is below guaranteed ${guarDown} Mbit/s.`);
    }
  } else {
    check.reasons.push('No guaranteed download speed configured.');
  }
  check.violations.download = download;

  // upload violation logic
  const upload = {
    measured: mu,
    guaranteed: Number.isFinite(guarUp) ? guarUp : null,
    advertised: Number.isFinite(advUp) ? advUp : null,
    belowGuaranteed: false,
  };
  if (Number.isFinite(guarUp) && guarUp > 0) {
    upload.belowGuaranteed = Number.isFinite(mu) ? mu < guarUp : false;
    if (upload.belowGuaranteed) {
      check.isViolation = true;
      check.reasons.push(`Upload ${mu} Mbit/s is below guaranteed ${guarUp} Mbit/s.`);
    }
  } else {
    check.reasons.push('No guaranteed upload speed configured.');
  }
  check.violations.upload = upload;

  // ping checks removed

  // final: if reasons only list notices but no true violation, isViolation stays whether any belowThreshold/ping.exceeded
  // we already set check.isViolation when belowThreshold or ping.exceeded.

  return { ...result, contractCheck: check };
}

export default { evaluateContract };
