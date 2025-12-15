import { IconTypelogo } from "../../typelogo";

export function MobileEditorNotice() {
  return (
    <div className="flex w-full flex-1 flex-col overflow-y-auto md:flex-row">
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        <div className="relative flex w-full flex-1 overflow-x-hidden overflow-y-hidden md:mt-0">
          <div className="w-split flex-column flex items-stretch justify-stretch z-10 w-full flex-1 overflow-hidden w-split-horizontal">
            <div
              className="w-split-pane flex min-h-svh w-full max-w-full flex-1 bg-background-primary md:min-h-full lg:min-w-[570px]"
              style={{ position: "relative" }}
              id="main-container"
            >
              <div className="fixed inset-0 z-1000000000 flex flex-col items-center justify-center gap-4 p-4">
                <div className="flex h-[500px] w-full max-w-[360px] flex-col overflow-hidden rounded-[32px] border border-border-secondary">
                  <div className="h-[60%]">
                    <img
                      alt="Seq Studio Mobile"
                      className="h-full w-full object-cover object-bottom"
                      src="/images/studio_mobile_web.png"
                    />
                  </div>
                  <div className="flex h-[40%] flex-col items-center justify-end gap-2 p-4">
                    <div className="flex-shrink-0">
                      <IconTypelogo className="text-white" />
                    </div>
                    <p
                      className="flex-shrink-0 text-center text-muted-foreground h-5 min-h-5"
                      style={{
                        fontSize: 14,
                        fontStyle: "normal",
                        fontWeight: 400,
                        lineHeight: "20px",
                      }}
                    >
                      Seq Studio is currently desktop-only.
                    </p>
                    <div className="mt-2 flex flex-shrink-0 flex-row gap-2">
                      <a
                        className="relative inline-block font-sans text-center before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:border before:bg-transparent after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit] after:bg-transparent after:opacity-0 enabled:hover:after:opacity-100 transition duration-75 before:transition before:duration-75 after:transition after:duration-75 select-none cursor-pointer rounded-full text-foreground-primary before:border-primary hover:before:bg-background-neautral-500 !border-none bg-background-neutral-400 px-6 py-4 text-lg font-medium before:!border-transparent"
                        href="/"
                      >
                        <span className="relative flex flex-row items-center justify-center gap-2">
                          Back Home
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileEditorNotice