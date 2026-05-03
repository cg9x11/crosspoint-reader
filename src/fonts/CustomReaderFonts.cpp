#include "CustomReaderFonts.h"

#include <EpdFont.h>
#include <EpdFontFamily.h>
#include <GfxRenderer.h>
#include <builtinFonts/all.h>

#include "../fontIds.h"

namespace {
EpdFont bokerlam12RegularFont(&bokerlam_12_regular);
EpdFont bokerlam14RegularFont(&bokerlam_14_regular);
EpdFont bokerlam16RegularFont(&bokerlam_16_regular);
EpdFont bokerlam18RegularFont(&bokerlam_18_regular);
EpdFontFamily bokerlam12FontFamily(&bokerlam12RegularFont);
EpdFontFamily bokerlam14FontFamily(&bokerlam14RegularFont);
EpdFontFamily bokerlam16FontFamily(&bokerlam16RegularFont);
EpdFontFamily bokerlam18FontFamily(&bokerlam18RegularFont);

EpdFont kicomictaxy12RegularFont(&kicomictaxy_12_regular);
EpdFont kicomictaxy14RegularFont(&kicomictaxy_14_regular);
EpdFont kicomictaxy16RegularFont(&kicomictaxy_16_regular);
EpdFont kicomictaxy18RegularFont(&kicomictaxy_18_regular);
EpdFontFamily kicomictaxy12FontFamily(&kicomictaxy12RegularFont);
EpdFontFamily kicomictaxy14FontFamily(&kicomictaxy14RegularFont);
EpdFontFamily kicomictaxy16FontFamily(&kicomictaxy16RegularFont);
EpdFontFamily kicomictaxy18FontFamily(&kicomictaxy18RegularFont);
}  // namespace

void registerCustomReaderFonts(GfxRenderer& renderer) {
  renderer.insertFont(BOKERLAM_12_FONT_ID, bokerlam12FontFamily);
  renderer.insertFont(BOKERLAM_14_FONT_ID, bokerlam14FontFamily);
  renderer.insertFont(BOKERLAM_16_FONT_ID, bokerlam16FontFamily);
  renderer.insertFont(BOKERLAM_18_FONT_ID, bokerlam18FontFamily);

  renderer.insertFont(KICOMICTAXY_12_FONT_ID, kicomictaxy12FontFamily);
  renderer.insertFont(KICOMICTAXY_14_FONT_ID, kicomictaxy14FontFamily);
  renderer.insertFont(KICOMICTAXY_16_FONT_ID, kicomictaxy16FontFamily);
  renderer.insertFont(KICOMICTAXY_18_FONT_ID, kicomictaxy18FontFamily);
}
