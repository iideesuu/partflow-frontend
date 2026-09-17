export const bomStates = {draft:'草稿',pending_review:'待审核',rejected:'已退回',approved:'已批准',release_pending:'待发布',release_failed:'发布失败',released:'已发布',obsolete:'已废止'};
export const bomActions = {submit:'提交审核',withdraw:'撤回',approve:'批准',reject:'退回',revise:'重新编辑',publish:'申请发布',release:'发布',retry_publish:'重试发布',abandon_publish:'放弃本次发布',retire:'废止'};

export function flattenBom(nodes, depth = 0) {
  return (nodes || []).flatMap(node => [{...node, depth}, ...flattenBom(node.children, depth + 1)]);
}

// A row cannot be moved below itself or any of its descendants.
export function parentCandidates(rows, itemId) {
  if (!itemId) return rows;
  const excluded = new Set([String(itemId)]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (excluded.has(String(row.parent_item)) && !excluded.has(String(row.id))) {
        excluded.add(String(row.id)); changed = true;
      }
    }
  }
  return rows.filter(row => !excluded.has(String(row.id)));
}

export function bomItemPayload(form) {
  const line = String(form.line_no).trim(), quantity = String(form.quantity).trim();
  if (!/^[1-9][0-9]*$/.test(line) || Number(line) > 2147483647) throw new Error('行号必须是有效的正整数。');
  if (!/^\d{1,12}(\.\d{1,6})?$/.test(quantity) || !/[1-9]/.test(quantity)) throw new Error('数量必须大于零，最多 12 位整数和 6 位小数。');
  if (!form.child_part_revision || !form.unit) throw new Error('请选择已发布的子零件版本和计量单位。');
  const position = String(form.position || '').trim();
  if (position && !/^[A-Za-z][A-Za-z0-9_.-]{0,31}$/.test(position)) throw new Error('位号必须以字母开头，只能包含字母、数字、点、下划线和连字符。');
  if (!position && !String(form.no_position_reason || '').trim()) throw new Error('无位号时请填写原因。');
  return {line_no:Number(line),child_part_revision:form.child_part_revision,quantity,unit:form.unit,
    parent_item:form.parent_item || null,position:position || '__NO_POSITION__',
    no_position_reason:position ? '' : form.no_position_reason.trim()};
}
