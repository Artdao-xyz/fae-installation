import { Filter } from "./Filter";

export function FiltersSystem() {
  return (
        <div className="flex items-stretch gap-4">
                <div className="flex flex-col gap-3 flex-1">
                        <h3 className="text-sm text-black/60 font-medium">Mission</h3>
                        <Filter title="21st Century Cultural Infrastructure" type="mission" />
                        <Filter title="21st Century Cultural Infrastructure" type="mission" />
                        <Filter title="21st Century Cultural Infrastructure" type="mission" />        
                </div>
                <div className="flex flex-col gap-3 flex-1">
                        <h3 className="text-sm text-black/60 font-medium">Vector</h3>
                        <Filter title="Advanced Production Capabilites" type="vector" />
                        <Filter title="Advanced Production Capabilites" type="vector" />
                        <Filter title="Advanced Production Capabilites" type="vector" />
                </div>
                <div className="flex flex-col gap-3 flex-1">
                        <h3 className="text-sm text-black/60 font-medium">Theme</h3>
                        <Filter title="Creative R&D" type="theme" />
                        <Filter title="Creative R&D" type="theme" />
                        <Filter title="Creative R&D" type="theme" />
                </div>

        </div>
  );
}