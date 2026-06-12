import type { Formation, SlotPlayers, TeamStrength } from '@/types';

// Per-position attack / defense weights, identical to 7a0's box-score model
// (their PT positions map to ours: GOL=GK, LD=RB, ZAG=CB, LE=LB, VOL=DM,
// MC=CM, MD=RM, ME=LM, MEI=AM, PD=RW, PE=LW, CA=ST).
export const ATT_WEIGHT: Record<string, number> = {
  GK: 0, RB: 0, CB: 0, LB: 0, DM: 0.2, CM: 0.5,
  RM: 0.5, LM: 0.5, AM: 0.8, RW: 1, LW: 1, ST: 1,
};
export const DEF_WEIGHT: Record<string, number> = {
  GK: 1, RB: 1, CB: 1, LB: 1, DM: 0.8, CM: 0.5,
  RM: 0.5, LM: 0.5, AM: 0.2, RW: 0, LW: 0, ST: 0,
};

/** A slot→player map with every formation slot empty. */
export function emptySlots(formation: Formation): SlotPlayers {
  const out: SlotPlayers = {};
  for (const slot of formation.slots) out[slot.key] = null;
  return out;
}

/**
 * Aggregate the chosen XI into attack / defense / overall, exactly as 7a0 does:
 *   attack  = round( Σ rating·attW / Σ attW )   (over every slot)
 *   defense = round( Σ rating·defW / Σ defW )
 *   overall = round( mean of the chosen players' ratings )
 * Empty slots still count in the weight denominators, so an incomplete XI is
 * weaker. Players contribute their full rating for the slot (no fit penalty).
 */
export function computeStrength(formation: Formation, slotPlayers: SlotPlayers): TeamStrength {
  let attNum = 0, attDen = 0, defNum = 0, defDen = 0, ratingSum = 0, filled = 0;

  for (const slot of formation.slots) {
    const aw = ATT_WEIGHT[slot.position];
    const dw = DEF_WEIGHT[slot.position];
    attDen += aw;
    defDen += dw;

    const player = slotPlayers[slot.key];
    if (player) {
      filled++;
      ratingSum += player.rating;
      attNum += player.rating * aw;
      defNum += player.rating * dw;
    }
  }

  return {
    attack: attDen ? Math.round(attNum / attDen) : 0,
    defense: defDen ? Math.round(defNum / defDen) : 0,
    overall: filled ? Math.round(ratingSum / filled) : 0,
    filled,
  };
}

