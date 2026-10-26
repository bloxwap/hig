/** Choose a HIG Select option through its visible custom popup. */
export async function selectHIGOption(page,label,optionLabel){
 await page.getByRole('combobox',{name:label,exact:true}).click();
 await page.getByRole('listbox').getByRole('option',{name:optionLabel,exact:true}).click();
}
