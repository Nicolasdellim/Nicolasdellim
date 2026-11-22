import Vision
import CoreImage
import AppKit
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1])
let ci = CIImage(contentsOf: url)!
let handler = VNImageRequestHandler(ciImage: ci)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let res = req.results?.first else { print("no subject"); exit(1) }
let buf = try res.generateScaledMaskForImage(forInstances: res.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
let cg = ctx.createCGImage(mask, from: mask.extent)!
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("ok", mask.extent)
