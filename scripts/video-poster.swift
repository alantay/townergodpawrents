// Saves a clip's first frame as an sRGB JPEG poster.
//
//   swift scripts/video-poster.swift in.mp4 out.jpg
//
// iPhone clips are usually HDR (HLG, BT.2020). A plain ffmpeg frame grab
// copies those values straight into an sRGB JPEG, so the poster comes out
// washed out next to the playing video. AVFoundation tone-maps HDR to SDR
// when it hands back a frame, so the poster matches what browsers show.
import AVFoundation
import CoreImage

let args = CommandLine.arguments
let generator = AVAssetImageGenerator(asset: AVURLAsset(url: URL(fileURLWithPath: args[1])))
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
let (frame, _) = try await generator.image(at: .zero)

try CIContext().writeJPEGRepresentation(
  of: CIImage(cgImage: frame),
  to: URL(fileURLWithPath: args[2]),
  colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
  options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.5]
)
