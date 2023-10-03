import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import singleIVDosingImage from '@/assets/singleIVDosingImage.png';
import oralDosingPlasmaTimeCurveImage from '@/assets/oralDosingPlasmaTimeCurveImage.png';
import intravenousInfusionAndEffectOfClearanceImage from '@/assets/intravenousInfusionAndEffectOfClearanceImage.png';
import nonLinearPharmacokineticsImage from '@/assets/nonLinearPharmacokineticsImage.png';
import multipleOralDosingImage from '@/assets/multipleOralDosingImage.png';


export const useRouteStore = defineStore('route', () => {
    const { t } = useI18n();
    //The translation seems unable to be done here, so we need to translate
    //when we use the actual text, this is due to the fact the store is
    //only initialized once and not responsive like the component
    const formulas =  [
        {
            key: 'route.formulas.singleIVDosing',
            path: '/formulas/single-iv-dosing',
            image: singleIVDosingImage,
        },
        {
            key: 'route.formulas.oralDosingPlasmaTimeCurve',
            path: '/formulas/oralDosingPlasmaTimeCurve',
            image: oralDosingPlasmaTimeCurveImage,

        },
        {
            key: 'route.formulas.intravenousInfusionAndEffectOfClearance',
            path: '/formulas/intravenousInfusionAndEffectOfClearance',
            image: intravenousInfusionAndEffectOfClearanceImage,

        },
        {
            key: 'route.formulas.nonLinearPharmacokinetics',
            path: '/formulas/nonLinearPharmacokinetics',
            image: nonLinearPharmacokineticsImage,

        },
        {
            key: 'route.formulas.multipleOralDosing',
            path: '/formulas/multipleOralDosing',
            image: multipleOralDosingImage,

        },
    ];

    return { formulas }
})
