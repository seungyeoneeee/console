// eslint-disable-next-line @typescript-eslint/no-var-requires
const spaceoneTailwindConfig = require('@cloudforet/mirinae/tailwind.config.cjs');
/**
 * Usage: https://github.com/postcss/postcss-simple-vars
 * */
module.exports = {
    'bg-color': spaceoneTailwindConfig.theme.colors.gray[100],
    'top-bar-height': '2.5rem',
    'gnb-toolbox-height': '2.25rem',
    'gnb-navigation-rail-min-width': '3.75rem',
    'gnb-navigation-rail-max-width': '16.25rem',
    'lsb-width': '15rem',
    'fnb-height': '2.5rem',
    'font-basic': 'Noto Sans, Roboto, arial, sans-serif',
    'font-code': 'Inconsolata, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
};
