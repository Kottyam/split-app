import { describe, expect, it } from 'vitest';
import { SHARED_HOME_CATEGORY_TRANSLATIONS } from './categoryTranslations';

describe('Shared Home category translations', () => {
  const categories=['Groceries','Electricity','Water','Internet','Gas / LPG','Maid / House Help','Cleaning','Repairs & Maintenance','Society / Maintenance Charges','Garbage / Waste','Food / Outside Food','Travel / Transport','Entertainment / Movies','Medical / Hospital','Household Items','Furniture / Appliances','Moving / Shifting','Delivery / Courier','Events / Parties','Other Shared Bills','Other'];
  it('has every category in all 12 supported languages',()=>{ expect(Object.keys(SHARED_HOME_CATEGORY_TRANSLATIONS)).toEqual(expect.arrayContaining(['en','ml','hi','ta','kn','te','mr','bn','gu','pa','or','as'])); for(const lang of Object.keys(SHARED_HOME_CATEGORY_TRANSLATIONS)) for(const category of categories) expect(SHARED_HOME_CATEGORY_TRANSLATIONS[lang][category]).toBeTruthy(); });
});
